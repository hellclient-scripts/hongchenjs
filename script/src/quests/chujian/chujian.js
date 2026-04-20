$.Module(function (App) {

    //吕文焕对你说道：近有熊建妞在长安城一带活动，武林败类欺我大宋无人，请这位大侠为武林除害！
    //你喝道：我靠，给我回去再好好练练功夫吧！
    //熊海静死了。
    //吕文焕磨了磨牙。
    // 你向吕文焕打听有关『kill』的消息。
    // 吕文焕对手中名册一看，说：这位大师,任务皆已发放完毕,不妨先去歇息，汪剑通那里也许需要你。

    let Cooldown = 40 * 1000
    let Chujian = {}
    Chujian.Data = {
        Count: 0,
        Success: 0,
        Name: "",
        Last: "",
        City: "",
        Times: 0,
        LastExp: 0,
        Tihui: 0,
        Start: 0,
        CurrentStart: 0,
        Cost: 0,
        LastTihui: null,
        Gifts: {},
        GiveUp: false,
    }
    let matcherTarget = /^吕文焕对你说道：近有(.*)在(.*)一带活动，武林败类欺我大宋无人，请这位大侠为武林除害！$/
    let matcherLater = /^吕文焕对手中名册一看，说：这位.+,任务皆已发放完毕,不妨先去歇息，汪剑通那里也许需要你。$/
    let matcherFail = "吕文焕哼了一声。"
    let matcherMe = "你向吕文焕打听有关『kill』的消息。"
    let PlanAsk = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            Chujian.Data.Last = Chujian.Data.Name
            Chujian.Data.Name = ""
            Chujian.Data.Loc = null
            Chujian.Data.GiveUp = false
            task.AddTrigger(matcherTarget, (tri, result) => {
                Chujian.Data.Name = result[1]
                Chujian.Data.City = result[2].slice(0, 2)
                Chujian.Data.Times = 0
            }).WithName("target")
            task.AddTrigger(matcherMe, (tri, result) => {
                Chujian.Data.CurrentStart = $.Now()
                return true
            })
            task.AddTrigger(matcherLater, (tri, result) => {
                if (App.History.GetLast(2)[0].Line == matcherMe) {
                    Note("锄奸冷却中")
                    App.Quests.GetQuest("baohu").Cooldown(-1)
                    return false
                }
                return true
            }).WithName("later")
            task.AddTrigger(matcherFail, (tri, result) => {
                if (App.History.GetLast(2)[0].Line == matcherMe) {
                    App.Log(`锄奸失败,${Chujian.Data.Last}@${Chujian.Data.City}`)
                    return false
                }
                return true
            }).WithName("fangqi")
            task.AddTimer(5000).WithName("timeout")
            App.Send("ask lv wenhuan about kill")
            $.RaiseStage("wait")
        },
        (result) => {
            App.Send("halt")
            if (Chujian.Data.Name) {
                if (App.QuestParams.chujiancancelat >= 0 && Chujian.Data.LastExp >= App.QuestParams.chujiancancelat) {
                    Note("放弃")
                    Chujian.Data.LastExp = 0
                    Chujian.Data.GiveUp = true
                    App.Send("ask lv wenhuan about fangqi")
                    App.Insert(
                        $.Sync(),
                    )
                    $.Next()
                    return
                }
                Quest.Cooldown(Cooldown)
                Chujian.Data.Count++
                Chujian.GoKill()
                return
            }
            if (result.Name == "fangqi") {
                App.Send("ask lv wenhuan about fangqi")
                Quest.Cooldown(-1)
                App.Insert(
                    $.Sync(),
                    // $.Timeslice("")
                )
            } else {
                // App.Core.Timeslice.Change("")
                Quest.Cooldown(Cooldown)
            }
            App.Next()
        }
    )
    let matcherGift = /^你得到了一级(.*)。$/
    let matcherExp = /^你得到了(.+)点武学经验和(.+)点潜能!体会和阅历,贡献也有所提高。$/
    //( 牛晚已经陷入半昏迷状态，随时都可能摔倒晕去。)
    let matcherHit = /^\s*\(\s*(.+)(似乎有些疲惫，但是仍然十分有活力。|看起来可能有些累了。|动作似乎有点不太灵光，但仍然有条不紊。|气喘嘘嘘，看起来状况并不太好。|似乎十分疲惫，看来需要好好休息了。|招架已然散乱，正勉力支撑著不倒下去。|看起来已经力不从心了。|歪歪斜斜地站都站立不稳，眼看就要倒地。|已经陷入半昏迷状态，随时都可能摔倒晕去。)\s*\)\s*$/
    Chujian.CancelCombat = () => {
        App.Reconnect(2000, Chujian.Connect)
    }
    Chujian.Connect = () => {
        App.Reconnect(2000, Chujian.Connect2)
    }
    Chujian.Connect2 = () => {
        $.PushCommands(
            $.Function(App.Core.Emergency.CheckDeath),
            $.Function(() => {
                App.Core.Weapon.PickWeapon()
                $.Next()
            }),
            $.Function(() => {
                App.Commands.Drop()
                Chujian.Data.Name = ""
                Chujian.Data.GiveUp = true
                $.Next()
            })
        )
        $.Next()
    }
    let PlanCombat = new App.Plan(
        App.Positions["Combat"],
        (task) => {
            let hit = false
            task.AddTrigger(`${Chujian.Data.Name}死了。`, (tri, result) => {
                Chujian.Data.Success++
                let cost = $.Now() - Chujian.Data.CurrentStart
                Note(`耗时${(cost / 1000).toFixed(2)}秒`)
                Chujian.Data.Cost += cost
                Chujian.Data.Name = ""
                App.Quests.GetQuest("baohu").Cooldown(-1)
                //Quest.Cooldown(Cooldown)
                return true
            })
            task.AddTrigger(matcherHit, (tri, result) => {
                if (result[1] == Chujian.Data.Name) {
                    if (hit == false) {
                        Note("成功命中NPC")
                        hit = true
                    }
                }
                return true
            })
            task.AddTrigger(matcherGift, (tri, result) => {
                let skillname = result[1]
                if (!Chujian.Data.Gifts[skillname]) {
                    Chujian.Data.Gifts[skillname] = 0
                }
                Chujian.Data.Gifts[skillname]++
                return true
            })
            if (App.QuestParams.chujiannohitfor >= 0) {
                task.AddTimer(App.QuestParams.chujiannohitfor * 1000, () => {
                    if (hit == false) {
                        Note("无法命中NPC，放弃")
                        Chujian.CancelCombat()
                        return
                    }
                    return true
                }).WithNoRepeat(true)
            }
            if (App.QuestParams.chujianmaxcombat >= 0) {
                task.AddTimer(App.QuestParams.chujianmaxcombat * 1000, () => {
                    Note("战斗时间过长，放弃")
                    Chujian.CancelCombat()
                    return false
                }).WithNoRepeat(true)
            }
            task.AddTrigger(matcherExp, (tri, result) => {
                App.Core.Analytics.Add(Quest.ID, App.CNumber.ParseNumber(result[1]), App.CNumber.ParseNumber(result[2]), 0)
                Chujian.Data.LastExp = App.CNumber.ParseNumber(result[1])
                return true
            })
        },
        (result) => {
        }
    )
    let Checker = function (wanted) {
        let result = App.Map.Room.Data.Objects.FindByLabel(wanted.Target).Items
        for (var obj of result) {
            if (obj.ID.indexOf(" ") > 0) {
                if (Chujian.Data.Name) {
                    if (App.Map.Room.ID) {
                        Chujian.Data.Loc = App.Map.Room.ID
                    }
                }
                return obj
            }
        }
        return null
    }

    Chujian.GoKill = function () {
        if (Chujian.Data.Name) {
            Chujian.Data.LastTihui = null
            if (Chujian.Data.Times < 4) {
                Chujian.Data.Times++
                Note(`第${Chujian.Data.Times}次尝试锄奸`)
                App.Core.HelpFind.HelpFind(Chujian.Data.Name)
                let wanted = App.NewWanted(Chujian.Data.Name, Chujian.Data.City).WithSingleStep(true).WithChecker(Checker)
                App.Insert(App.Commands.NewFunctionCommand(Chujian.GoKill))
                App.Commands.PushCommands(
                    App.NewPrepareCommand(""),
                    $.Function(() => {
                        $.RaiseStage("prepare")
                        $.Next()
                    }),
                    $.Sync(),
                    $.Function(() => {
                        if (Chujian.Data.Loc) {
                            App.Zone.SearchRooms([Chujian.Data.Loc], wanted)
                        } else {
                            App.Zone.Search(wanted)
                        }
                    }),
                    App.Commands.NewFunctionCommand(Chujian.KillLoc),
                )
            } else {
                // App.Core.Timeslice.Change("")
                App.Log(`锄奸失败,放弃${Chujian.Data.Name}@${Chujian.Data.City}`)
            }
        } else {
            $.Insert($.Prepare("commonWithExp"))
            // App.Core.Timeslice.Change("")
            if (Chujian.Data.GiveUp) {
                Note("放弃锄奸")
            } else {
                Note("锄奸成功")

            }
        }
        App.Next()
    }
    Chujian.KillLoc = function () {
        if (App.Zone.Wanted && App.Zone.Wanted.Loc && App.Zone.Wanted.ID) {
            Chujian.Data.Times = 0
        }
        if (App.Map.Room.Data.Objects.FindByLabel(Chujian.Data.Name).First()) {
            App.Map.Room.Data.Objects.Clear()
            $.Insert(
                $.Do("hp"),
                App.NewKillCommand(App.Zone.Wanted.ID, App.NewCombat("chujian").WithPlan(PlanCombat).WithBeforeStop(Chujian.BeforeStop)),
                $.Function(Chujian.CountTihui),
                $.Function(Chujian.KillNear),
            )
        } else {
            if (Chujian.Data.Loc) {
                Chujian.Data.Loc = null
                $.Insert(
                    $.Function(Chujian.KillNear)
                )
            }
        }

        App.Next()

    }
    Chujian.BeforeStop = function (combat, reason) {
        Chujian.Data.LastTihui = App.Data.Player.HP["体会"]
    }
    Chujian.CountTihui = function () {
        if (Chujian.Data.GiveUp) {
            App.Commands.Drop()
            $.Insert(
                $.To("lv wenhuan"),
                $.Function(() => {
                    App.Send("ask lv wenhuan about fangqi")
                    Quest.Cooldown(-1)
                    App.Insert(
                        $.Sync(),
                    )
                    $.Next()
                }))
            $.Next()
            return
        }
        if (Chujian.Data.Name == "") {
            Note("结算")
            let tihui = App.Data.Player.HP["体会"] - Chujian.Data.LastTihui
            if (tihui > 0) {
                Chujian.Data.LastTihui = null
                Note(`体会增加${tihui}`)
                Chujian.Data.Tihui += tihui
                App.Core.Analytics.Add(Quest.ID, 0, 0, tihui)
            }
        }
        $.Next()
    }
    Chujian.KillNear = () => {
        if (Chujian.Data.Name) {
            if (App.Map.Room.ID) {
                Note("NPC跑了，附近找找")
                Chujian.Data.Loc = null
                let rooms = App.Mapper.ExpandRooms([App.Map.Room.ID], 2, true)
                App.Zone.Wanted = $.NewWanted(Chujian.Data.Name, Chujian.Data.City).WithID(Chujian.Data.ID).WithChecker(Checker)
                $.PushCommands(
                    $.Function(() => {
                        App.Zone.SearchRooms(rooms, wanted, App.Map.SingleStep())
                    }),
                    $.Function(Chujian.KillLoc),
                )
            }
        }
        $.Next()
    }

    Chujian.Go = function () {
        App.PushCommands(
            $.Prepare("commonWithExp"),
            // $.Timeslice("锄奸"),
            $.To("lv wenhuan"),
            $.Plan(PlanAsk),
        )
        App.Next()
    }
    Chujian.GetEff = function () {
        return Chujian.Data.Success * 3600 * 1000 / ($.Now() - Chujian.Data.Start)
    }
    Chujian.GetTimesliceEff = function () {
        let ts = App.Core.Timeslice.Get(Quest.Timeslice)
        return ts ? Chujian.Data.Success * 3600 * 1000 / ts : 0
    }

    Chujian.HelpRate = () => {
        return Chujian.Data.Success > 3 ? (Chujian.Data.helped * 100 / Chujian.Data.Success) : 0
    }
    App.BindEvent("core.helpfind.onfound", (event) => {
        let name = event.Data.Name
        let id = event.Data.ID
        let loc = event.Data.Loc
        if (Chujian.Data.Name == name) {
            let cites = App.Zone.LocToCityList[loc] || []
            if (cites.length == 0) {
                return
            }
            if (cites.indexOf(Chujian.Data.City) < 0) {
                return
            }
            if (!Chujian.Data.ID && id) {
                Chujian.Data.ID = id.toLowerCase()
            }
            if (!Chujian.Data.Loc) {
                Note("接到线报:" + name + "|" + id + "|" + loc)
                Chujian.Data.helped++
                Chujian.Data.Loc = loc
            }
            if (App.Zone.Wanted && App.Zone.Wanted.Target == name) {
                App.Zone.Wanted.Loc = loc
            }
        }
    })

    let Quest = App.Quests.NewQuest("chujian")
    Quest.Name = "锄奸"
    Quest.Timeslice = "锄奸"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Group = "chujian"
    Quest.OnHUD = () => {
        return [
            new App.HUD.UI.Word("锄奸效率:"),
            new App.HUD.UI.Word(Chujian.Data.Success > 3 ? Chujian.GetEff().toFixed(0) : "-", 5, true),
        ]
    }
    Quest.OnSummary = () => {
        return [
            new App.HUD.UI.Word("锄:"),
            new App.HUD.UI.Word(Chujian.Data.Success > 3 ? Chujian.GetEff().toFixed(0) : "-", 5, true),
        ]
    }
    Quest.OnReport = () => {
        let gifts = Object.keys(Chujian.Data.Gifts).map((gift) => `${gift}*${Chujian.Data.Gifts[gift]}`).join(",")
        let num = Chujian.HelpRate()
        let rate = num ? num.toFixed(0) + "%" : "-"
        let avg = Chujian.Data.Success > 0 ? (Chujian.Data.Tihui / Chujian.Data.Success).toFixed(0) : 0
        return [
            `锄奸-总数:${Chujian.Data.Count} 成功:${Chujian.Data.Success} 毛效率:${Chujian.Data.Success > 3 ? Chujian.GetEff().toFixed(0) + "个/小时" : "-"} 净效率:${Chujian.Data.Success > 3 ? Chujian.GetTimesliceEff().toFixed(0) + "个/小时" : "-"} 平均体会:${avg} 平均耗时:${Chujian.Data.Success > 3 ? (Chujian.Data.Cost / Chujian.Data.Success / 1000).toFixed(2) + "秒" : "-"}  上次Exp:${Chujian.Data.LastExp} 线报率:${rate}`,
            `锄奸-奖励:${gifts}`
        ]
    }
    Quest.Start = function (data) {
        Chujian.Go()
    }
    Quest.GetReady = function (q, data) {
        return () => { Quest.Start(data) }
    }
    App.Core.Quest.AppendInitor(() => {
        Chujian.Data = {
            Count: 0,
            Success: 0,
            Name: "",
            Start: 0,
            City: "",
            Times: 0,
            LastExp: 0,
            LastTihui: null,
            Tihui: 0,
            Cost: 0,
            Gifts: {},
            helped: 0,
            Start: $.Now(),
            CurrentStart: 0,
            GiveUp: false,
        }
    })
    App.Quests.Register(Quest)
    Quest.TimeCost = 30
    App.Quests.Chujian = Chujian
    App.Core.Analytics.RegisterTask(Quest.ID, Quest.Name, Quest.Timeslice ? Quest.Timeslice : Quest.Name)

})