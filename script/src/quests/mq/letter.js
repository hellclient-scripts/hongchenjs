$.Module(function (App) {
    let MQ = {}
    class NPC {
        constructor(name) {
            this.Name = name
            this.Start = $.Now()
        }
        RawZone = ""
        Start = 0
        Retry = false
        Retried = false
        Name = ""
        ID = ""
        Zone = ""
        HelpZone = ""
        Times = 0
        CombatDuration = 0
        Died = false
        Fled = false
        First = true
        KilledRoom = ""
        NotKilled = true
        Farlist = null
        BeichouTimes = 0
        FleeTimes = 0
        SearchTimes = 0
        NearTimes = 0
        HelpedTimes = 0
        Head = false
        Loc = null
        Flee(onfight) {
            if (onfight && App.Map.Room.ID & App.Zone.LocToZone[App.Map.Room.ID]) {
                this.Info = [App.Zone.InfoByZone[App.Zone.LocToZone[App.Map.Room.ID]]]
            }
            if (this.Info == null || this.Info.length == 0) {
                this.Info = []
                App.Zone.ZonesByCity[this.Zone].forEach(zone => {
                    let info = App.Zone.InfoByZone[zone]
                    if (info && info.length) {
                        this.Info.push(info)
                    }
                })
            }
            this.HelpZone = ""
            this.First = true
            this.Fled = true
            this.FleeTimes++
            this.Loc = null
        }
        SetZone(zone, ishelpzone) {
            this.Zone = zone
            if (ishelpzone) {
                this.HelpZone = zone
            }
            this.Fled = false
            this.Farlist = null
            this.Info = []
            this.Times = 0
        }
        NextFar() {
            this.Zone = this.Farlist.shift()
            this.Times = 0
            this.Fled = false
            this.Info = []
        }
    }
    MQ.Data = {
        SlowLog: [],
        kills: 0,
        helped: 0,
        start: null,
        current: null,
        Last: null,
        last: 0,
        eff: 0,
        combatDuration: 0,
        cost: 0,
        tihui: 0,
        gifts: {},
        rejected: {},
    }
    MQ.NeedJiqu = (letter) => {
        if (App.Core.Study.Jiqu.Max > 0 && App.QuestParams["mqtihui"] > 0 && App.Core.Study.CanJiqu()) {
            if (!letter && MQ.HelpRate() < 50) {
                return false
            }
            let tihui = App.QuestParams["mqtihui"]
            return App.Data.Player.HP["体会"] >= tihui
        }
        return false

    }
    MQ.HelpRate = () => {
        return MQ.Data.kills > 3 ? (MQ.Data.helped * 100 / MQ.Data.kills) : 0
    }
    MQ.OnNpcDie = function () {
        MQ.Data.NPC.KilledRoom = `${App.Map.Room.Name}(${App.Map.Room.ID})`
        $.RaiseStage("npcdie")
    }
    MQ.LastPause = 0
    MQ.Pause = () => {
        $.Insert(
            $.Do("#jiqu"),
            $.Wait(1000),
            $.Function(() => {
                MQ.LastPause = $.Now()
                App.Send("halt")
                $.Next()
            })
        )
        $.Next()
    }
    MQ.OnNpcFaint = function () {
        $.RaiseStage("npcfaint")
    }
    MQ.CheckBeichou = () => {
        $.PushCommands(
            $.Prepare(),
            $.Function(() => {
                App.Core.NPC.CheckBeichou(MQ.Data.NPC.Name, MQ.Data.NPC.ID)
            }),
            $.Function(() => {
                if (App.Core.NPC.AskBeichouData.Live) {
                    MQ.GiveBeiChou()
                } else {
                    App.Log("NPC没了")
                    MQ.GiveHead()
                }
            })
        )
        $.Next()
    }
    MQ.Verify = () => {
        if (!App.Quests.Stopped && App.Core.QuestLock.Freequest <= 0) {
            $.PushCommands(
                $.To(App.Params.LocMaster),
                $.Function(MQ.AskQuest),
            )
        } else {
            // App.Core.Timeslice.Change("")
        }
        $.Next()
    }
    MQ.Prepare = () => {
        $.PushCommands(
            // $.Timeslice(""),
            $.Prepare("commonWithExp"),
            // $.Timeslice("MQ"),
            $.Function(MQ.Verify),
        )
        $.Next()
    }
    MQ.NeedGift = (name) => {
        switch (App.QuestParams.mqgift) {
            case "auto":
                return App.Core.Assets.Gift.Need(name)
            case "no":
                return false
        }
        return App.QuestParams.mqgift.split(",").indexOf(name) > -1
    }
    MQ.CanAccept = () => {
        return false
    }
    //马钰对你道：这封信你帮我交到许裳骅手中，他现在应该在嵩山一带，然后把回执带回来给我！
    let reQuest = /^([^：()\[\]]{2,5})对你道：这封信你帮我交到(.+)手中，他现在应该在(.+)，然后把回执带回来给我！$/
    //据闻不久前此人曾经在苏州城。
    let reStart = /^据闻不久前此人曾经在(.+)。/
    let reFail = /^([^：()\[\]]{2,5})一脸怒容对你道：我不是让你.+把信送到/
    let reNoMaster = "这里没有这个人，你怎么领任务？"
    let reNoQuest = "你现在没有领任何任务！"
    let reCurrent = /^师长交给你的任务，你已经连续完成了 (\d+) 个。$/
    let reReward = /^.{2,5}对你皱眉道：我问你话呢，那东西你到底要\(answer Y\|N\)还是不要？$/
    let reFreequest = "你突然想到：现在江湖正值动乱，何不四处走访，也许可提高自己的经验阅历。"
    let PlanQuest = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            let fled = false
            let fail = false
            let getquest = false
            MQ.Data.NoMaster = false
            //MQ.Data.NPC = null
            MQ.Data.last = MQ.Data.current
            MQ.Data.current = null
            task.AddTrigger(reQuest, (tri, result) => {
                MQ.Data.NPC = new NPC(result[2])
                MQ.Data.LastNPC = MQ.Data.NPC
                getquest = true
                return true
            })
            task.AddTrigger(reReward, (tri, result) => {
                App.Send("answer N")
                return true
            })
            task.AddTrigger(reFail, () => {
                fail = true
                return true
            })
            task.AddTrigger(reNoMaster, () => {
                MQ.Data.NoMaster = true
                return true
            })

            //reNoQuest和reStart应该会出现一个
            task.AddTrigger(reNoQuest)
            task.AddTrigger(reStart, (tri, result) => {
                if (fail) {
                    App.Send("quest cancel")
                    MQ.Data.NPC = null
                    return false
                }
                if (getquest || (MQ.Data.NPC && MQ.Data.NPC.Retry)) {
                    if (MQ.Data.NPC && !MQ.Data.NPC.Retry) {
                        MQ.Data.NPC.Zone = result[1].slice(0, 2)
                        MQ.Data.NPC.HelpZone = MQ.Data.NPC.Zone
                        MQ.Data.NPC.RawZone = MQ.Data.NPC.Zone
                        if (fled) {
                            MQ.Data.NPC.Flee()
                        }
                    }
                } else {
                    MQ.Data.NPC = null
                }
                return false
            })
            task.AddTimer(3000).WithName("timeout")
            $.RaiseStage("mqgivehead")
            App.Send("give receipt to " + App.Params.MasterID + ";drop receipt;drop letter")
            $.RaiseStage("mqbefore")
            App.Send("quest " + App.Params.MasterID)
            App.Send("quest")
        },
        (result) => {
            if (result.Type != "cancel") {
                if (result.Name == "timeout") {
                    App.Log("请求quest超时")
                }
                $.Next()
            }
        }
    )
    MQ.GiveHead = () => {
        $.PushCommands(
            $.To(App.Params.LocMaster),
            $.Function(() => {
                $.RaiseStage("mqgivehead")
                $.Next()
            }),
            $.Do("give receipt to " + App.Params.MasterID + ";drop receipt;drop letter"),
            $.Sync(),
            // $.Function(MQ.Prepare),
        )
        $.Next()
    }

    MQ.AskQuest = () => {
        $.PushCommands(
            $.To(App.Params.LocMaster),
            $.Plan(PlanQuest),
            $.Function(() => {
                if (MQ.Data.NoMaster) {
                    Quest.Cooldown(3000000)
                    Note("师傅没了，任务冷却5分钟")
                    App.Log("师傅没了")
                    // App.Core.Timeslice.Change("")
                } else if (MQ.Data.NPC) {
                    $.Insert($.Nobusy(), $.Function(MQ.Ready))
                } else {
                    $.Insert(
                        $.Wait(1000),
                        $.Function(MQ.Ready),
                    )
                }
                App.Next()
            }),
        )
        $.Next()
    }
    let Checker = function (wanted) {
        let result = App.Map.Room.Data.Objects.FindByLabel(wanted.Target).Items
        for (var obj of result) {
            if (obj.ID.indexOf(" ") > 0) {
                if (MQ.Data.NPC) {
                    if (App.Map.Room.ID) {
                        MQ.Data.NPC.Loc = App.Map.Room.ID
                    }
                    if (MQ.Data.NPC.Zone) {
                        MQ.Data.NPC.SetZone(MQ.Data.NPC.Zone)
                    }
                }
                return obj
            }
        }
        return null
    }
    let Next = function (map, move, wanted) {
        if (App.QuestParams["mqnopause"] == 0) {
            if (MQ.NeedJiqu()) {
                if (Metronome.GetSpace() <= 3 && ($.Now() - MQ.LastPause > 1000)) {
                    Note("走的太快，汲取一下")
                    let snap = App.Map.Snap()
                    $.Insert(
                        $.Function(MQ.Pause),
                        $.Function(() => {
                            App.Map.Rollback(snap)
                            App.Zone.DefaultNext(map, move, wanted)
                        })
                    )
                    $.Next()
                    return
                }
            }
        }
        App.Zone.DefaultNext(map, move, wanted)
    }

    MQ.Ready = () => {

        if (MQ.Data.NPC) {
            if (MQ.Data.NPC.Retry) {
                App.Log("尝试再次寻找NPC")
                MQ.Data.NPC.Retry = false
                MQ.Data.NPC.Died = false
                MQ.Data.NPC.Fled = false
                MQ.Far(true)
                return
            }
            if (MQ.Data.NPC.Died) {
                $.PushCommands(
                    $.Function(App.Check),
                    $.Function(function () {
                        Note("交头")
                        if (MQ.CanAccept()) {
                            MQ.WaitLetter()
                            return
                        }
                        Note("不接信")
                        MQ.GiveHead()
                    }),
                )
                $.Next()
                return
            }
            if (MQ.Data.NPC.Fled) {
                MQ.AskInfo()
                return
            }
            Note("找人")
            MQ.GoKill()
            return
        }
        Note("准备")
        MQ.Prepare()
    }
    //北丑在你的耳边悄声说道：据可靠消息，这个人刚才在青草坪。
    let matcherBeichou = /^北丑在你的耳边悄声说道：据可靠消息，这个人刚才在(.+)。$/
    let PlanBeichou = new App.Plan(
        App.Positions["Response"],
        (task) => {
            task.AddTrigger(matcherBeichou, (tri, result) => {
                MQ.Data.NPC.BeichouTimes++
                task.Data = result[1]
                return true
            })
            var gold = "1 gold"
            if (App.Core.NPC.AskBeichouData.Silver && App.Data.Item.List.FindByID("Silver").Sum() > 10) {
                gold = "10 silver"
            }
            App.Send(`give ${gold} to bei chou;i`)
            App.Sync()
        },
        (result) => {
            if (result.Task.Data) {
                MQ.FarRoomName(result.Task.Data)
                return
            }
            MQ.Far()
        })
    MQ.GiveBeiChou = () => {
        //if (App.QuestParams["mqgivebeichou"] == "t" && (MQ.Data.NPC.Farlist == null || App.Core.NPC.AskBeichouData.Silver)) {
        if (App.QuestParams["mqgivebeichou"] == "t") {
            PlanBeichou.Execute()
            return
        }
        MQ.Far()
    }
    MQ.FarRoomName = (name) => {
        let rooms = App.Zone.NameToLocList[name]
        if (rooms) {
            rooms = App.Mapper.ExpandRooms(rooms, 2, true)
            let farlist = [...App.Zone.NameToCityList[name]]
            if (farlist.length > 0) {
                MQ.Data.NPC.SetZone(farlist.shift())
            }
            MQ.Data.NPC.Farlist = farlist
            let wanted = $.NewWanted(MQ.Data.NPC.Name, MQ.Data.NPC.Farlist[0]).WithChecker(Checker).WithID(MQ.Data.NPC.ID)
            MQ.Data.NPC.Loc = null
            MQ.Data.NPC.Fled = true
            $.PushCommands(
                $.Prepare(),
                $.Function(() => {
                    App.Zone.SearchRooms(rooms, wanted)
                }),
                $.Function(MQ.KillLoc),
                $.Function(MQ.Ready),
            )
            $.Next()
            return
        } else {
            App.Log(`未登记的房间 ${name}`)
            MQ.Data.NPC.Farlist == null
        }
        MQ.Far()
    }
    MQ.Far = (force) => {
        if (MQ.Data.NPC.Farlist == null || force) {
            MQ.Data.NPC.Farlist = [...App.Zone.CiteList]
            let exp = App.Data.Player.HP["经验"]
            if (exp < 150000) {
                MQ.Data.NPC.Farlist = MQ.Data.NPC.Farlist.slice(0, -4)
            } else if (exp < 400000) {
                MQ.Data.NPC.Farlist = MQ.Data.NPC.Farlist.slice(0, -2)
            } else if (exp < 700000) {
                MQ.Data.NPC.Farlist = MQ.Data.NPC.Farlist.slice(0, -1)
            } else {
                // MQ.Data.NPC.Farlist.unshift(MQ.Data.NPC.Farlist.pop())
            }
            MQ.Data.NPC.Loc = null
            MQ.Data.NPC.NextFar()
            MQ.Ready()
            return
        }
        if (MQ.Data.NPC.Farlist.length) {
            MQ.Data.NPC.NextFar()
            $.PushCommands($.Prepare(), $.Function(MQ.Ready))
            $.Next()
            return
        }
        Note("很远没找到，放弃")
        App.Log("很远没找到，放弃")
        MQ.GiveHead()
    }
    MQ.KillNear = () => {
        if (App.Map.Room.ID && !MQ.Data.NPC.Fled && !MQ.Data.NPC.Died) {
            Note("NPC跑了，附近找找")
            MQ.Data.NPC.Loc = null
            MQ.Data.NPC.NearTimes++
            let rooms = App.Mapper.ExpandRooms([App.Map.Room.ID], 2, true)
            App.Zone.Wanted = $.NewWanted(MQ.Data.NPC.Name, MQ.Data.NPC.Zone).WithChecker(Checker).WithID(MQ.Data.NPC.ID)
            $.PushCommands(
                $.Function(() => {
                    App.Zone.SearchRooms(rooms, wanted)
                }),
                $.Function(MQ.KillLoc),
            )
        }
        App.Next()
    }
    MQ.KillLoc = () => {
        if (!MQ.Data.NPC.ID && App.Zone.Wanted.ID) {
            MQ.Data.NPC.ID = App.Zone.Wanted.ID
        }

        if (App.Map.Room.Data.Objects.FindByLabel(MQ.Data.NPC.Name).First()) {
            App.Map.Room.Data.Objects.Clear()
            $.Insert(
                $.Plan(PlanLetter),
                $.Function(() => {
                    if (!(MQ.Data.NPC.Died || MQ.Data.NPC.Fled)) {
                        $.Insert($.Function(MQ.KillNear))
                    }
                    App.Next()
                })
            )
        } else {
            if (MQ.Data.NPC.Loc) {
                MQ.Data.NPC.Loc = null
                $.Insert(
                    $.Function(MQ.KillNear)
                )
            }
        }
        $.Next()
    }
    MQ.GoKill = () => {
        if (!(MQ.Data.NPC.Times < App.QuestParams["mqmaxsearch"])) {
            Note("找不到")
            MQ.CheckBeichou()
            return
        }
        App.Core.HelpFind.HelpFind(MQ.Data.NPC.Name)
        //let zone = MQ.Data.NPC.First ? Cities[MQ.Data.NPC.Zone].Path1 : Cities[MQ.Data.NPC.Zone].Path;
        let zone = MQ.Data.NPC.First ? `${MQ.Data.NPC.Zone}1` : MQ.Data.NPC.Zone
        MQ.Data.NPC.First = false
        MQ.Data.NPC.SearchTimes++
        let wanted = $.NewWanted(MQ.Data.NPC.Name, zone).
            WithChecker(Checker).WithNext(Next).WithOrdered(true).WithID(MQ.Data.NPC.ID)
        $.PushCommands(
            $.Function(() => {
                if (MQ.Data.NPC.Times > 0 && MQ.Data.NPC.Zone != "西域") {
                    if (App.QuestParams["mqnopause"] == 0) {
                        if (MQ.NeedJiqu()) {
                            Note("遍历之前，汲取一下")
                            $.RaiseStage("mqpause")
                            $.Insert(
                                $.Function(MQ.Pause),
                            )
                        }
                    }
                }
                App.Next()
            }),
            $.Prepare(),
            $.To(App.Zone.GetMap(MQ.Data.NPC.Zone).Rooms),
            // $.To(Cities[MQ.Data.NPC.Zone].Loc),
            $.Function(() => {
                App.Send("yun recover;yun regenerate")
                $.RaiseStage("prepare")
                $.PushCommands(
                    $.Sync(),
                    $.Function(() => {
                        if (MQ.Data.NPC.Loc) {
                            App.Zone.SearchRooms([MQ.Data.NPC.Loc], wanted)
                        } else {
                            App.Zone.Search(wanted)
                        }
                    })
                )
                $.Next()
            }),
            $.Function(MQ.KillLoc),
            $.Function(() => {
                MQ.Data.NPC.Times++
                Note("第" + MQ.Data.NPC.Times + "次搜索完毕")
                MQ.Ready()
            }),

        )
        $.Next()
    }
    MQ.Connect = () => {
        planOverQuest.Execute()
        $.PushCommands(
            $.Function(App.Core.Emergency.CheckDeath),
            $.Function(() => {
                App.Core.Weapon.PickWeapon()
                $.Next()
            }),
            $.Function(MQ.KillLoc)
        )
        $.Next()
    }
    //许裳骅交给你一张回执。
    let matcherOk = /^(.+)交给你一张回执。$/
    let PlanLetter = new App.Plan(App.Positions["Response"],
        (task) => {
            task.AddTrigger(matcherOk, (tri, result) => {
                MQ.Data.NPC.Died = true
                return true
            })
            App.Send(`give letter to ${MQ.Data.NPC.ID}`)
            App.Sync()
        },
        (result) => {
            $.Next()
        }
    )

    App.BindEvent("core.helpfind.onfound", (event) => {
        let name = event.Data.Name
        let id = event.Data.ID
        let loc = event.Data.Loc
        if (MQ.Data.NPC && MQ.Data.NPC.Name == name) {
            let cites = App.Zone.LocToCityList[loc]
            if (cites.length == 0) {
                return
            }
            if (MQ.Data.NPC.HelpZone && cites.indexOf(MQ.Data.NPC.HelpZone) == -1) {
                return
            }
            if (!MQ.Data.NPC.ID && id) {
                MQ.Data.NPC.ID = id.toLowerCase()
            }
            if (!MQ.Data.NPC.Loc && !MQ.Data.NPC.Died) {
                Note("接到线报:" + name + "|" + id + "|" + loc)
                MQ.Data.helped++
                MQ.Data.NPC.HelpedTimes++
                MQ.Data.NPC.Loc = loc
                MQ.Data.NPC.SetZone(cites[0])
            }
            if (App.Zone.Wanted && App.Zone.Wanted.Target == name) {
                App.Zone.Wanted.Loc = loc
            }
            MQ.Data.NPC.Farlist = null
        }
    })

    let Quest = App.Quests.NewQuest("letter")
    Quest.Name = "师门送信任务"
    Quest.Timeslice = "送信"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Group = "mq"
    let matcherreward = /^通过这次锻炼你获得了(.+)点经验，(.+)点潜能及(.+)点实战体会。/
    let matcherquestfail = /^([^：()\[\]]{2,5})摆摆手，对你道：你干不了就算了/
    let matchergift = /^([^：()\[\]]{2,5})微微一笑，从怀中取出一.(.+)交给你。$/
    let matcherAskGift = /^获得(.+)需要消耗你.+点门派贡献，/
    let planOverQuest = new App.Plan(App.Quests.Position,
        (task) => {
            task.AddTrigger(matcherreward, (tri, result) => {
                let msg = "任务成功"
                Note(msg)
                App.Core.Analytics.Add(Quest.ID, App.CNumber.ParseNumber(result[1]), App.CNumber.ParseNumber(result[2]), App.CNumber.ParseNumber(result[3]))
                return true
            })
            task.AddTrigger(matcherAskGift, (tri, result) => {
                let name = result[1]
                if (MQ.NeedGift(name)) {
                    App.Send("answer Y")
                } else {
                    if (!MQ.Data.rejected[name]) {
                        MQ.Data.rejected[name] = 0
                    }
                    MQ.Data.rejected[name]++
                    App.Send("answer N")
                }
                return true
            })

            task.AddTrigger(matcherquestfail, (tri, result) => {
                let npcmsg = ""
                if (MQ.Data.LastNPC) {
                    npcmsg = `NPC:${MQ.Data.LastNPC.Name}(${MQ.Data.LastNPC.ID}) 位置:${MQ.Data.LastNPC.Zone}`
                } else {
                    npcmsg = "无NPC信息"
                }
                App.Log(`任务失败，当前任务:${MQ.Data.last || 0} ${npcmsg}`)
                MQ.Data.LastNPC = null
                return true
            })
            task.AddTrigger(matchergift, (tri, result) => {
                let gift = result[2]
                if (MQ.Data.gifts[gift]) {
                    MQ.Data.gifts[gift]++
                } else {
                    MQ.Data.gifts[gift] = 1
                }
                return true
            })
        },
    )
    MQ.GetEff = function () {
        return MQ.Data.kills * 3600 * 1000 / ($.Now() - MQ.Data.start)
    }
    MQ.GetTimesliceEff = function () {
        let ts = App.Core.Timeslice.Get(Quest.Timeslice)
        return ts ? MQ.Data.kills * 3600 * 1000 / ts : 0
    }
    Quest.Start = function (data) {
        if (!App.Params.MasterID) {
            PrintSystem("掌门ID " + App.Params.MasterID + " 无效")
            return
        }
        if (!App.Params.LocMaster) {
            PrintSystem("掌门位置 " + App.Params.LocMaster + " 无效")
            return
        }
        MQ.Data.NPC = null
        planOverQuest.Execute()
        MQ.Prepare()
    }
    Quest.GetReady = function (q, data) {
        if (App.Core.QuestLock.Freequest > 0) {
            return null
        }
        return () => { Quest.Start(data) }
    }
    App.Core.Quest.AppendInitor((e) => {
        MQ.Data = {
            SlowLog: [],
            kills: 0,
            helped: 0,
            start: $.Now(),
            current: null,
            eff: 0,
            tihui: 0,
            gifts: {},
            cost: 0,
            combatDuration: 0,
            rejected: {},
        }
    })
    App.Quests.Register(Quest)
    App.Quests.MQ = MQ
    Quest.TimeCost = 10
    App.Core.Analytics.RegisterTask(Quest.ID, Quest.Name, Quest.Timeslice ? Quest.Timeslice : Quest.Name)
})