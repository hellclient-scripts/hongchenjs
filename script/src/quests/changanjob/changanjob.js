$.Module(function (App) {
    var Changan = {}
    Changan.Data = {
        Type: "",
        Target: [],
        Name: "",
        Code: "",
    }
    Changan.All = 0
    Changan.Success = 0
    Changan.Gifts = {}
    Changan.Current = 0
    Changan.Go = function () {
        Changan.Data = {
            Type: "",
            Target: [],
            Name: "",
            Code: ""
        }
        $.PushCommands(
            $.Prepare("commonWithStudy"),
            // $.Timeslice("长安"),
            $.To("liang xinglu"),
            $.Ask("liang xinglu", "任务", 10),
            $.Function(Changan.Check),
        )
        $.Next()
    }

    Changan.Finish = function () {
        $.PushCommands(
            $.To("liang xinglu"),
            $.Function(() => {
                switch (Changan.Data.Type) {
                    case "ambush":
                    case "patrol":
                        $.Insert($.Do("give gong han to liang xinglu"), $.Sync())
                        break
                    case "code":
                        $.Insert($.Ask("liang xinglu", "复命"))
                        break
                }
                $.Next()
            }),
            $.Nobusy(),
            // $.Timeslice(""),
            $.Prepare(),
        )
        $.Next()
    }
    Changan.Fail = function () {
        $.PushCommands(
            $.To("liang xinglu"),
            $.Ask("liang xinglu", "取消"),
            $.Nobusy(),
            // $.Timeslice(""),
            $.Prepare(),
        )
        $.Next()
    }
    let matcherTooMany = /^梁兴禄盯着你看了看，说道：“对不起，.+内只能领取.+个任务！$/
    Changan.Check = function () {
        if (App.Data.Ask.Answers.length) {
            if (App.Data.Ask.Answers[0].Line == "梁兴禄对你说道：本府不是已经给你派发了差事，完不成的话就先跟我取消。") {
                Changan.Fail();
                return;
            }
            if (App.Data.Ask.Answers[0].Line == "梁兴禄对你说道：你的江湖经验已经很高了，再在衙门里也混不出个名堂了。") {
                Quest.Cooldown(10 * 60 * 60 * 1000)
                App.Next();
                return

            }
            if (App.Data.Ask.Answers[0].Line == "梁兴禄盯着你看了看，说道：“你刚取消过一次任务，过一分钟再来吧。”") {
                Quest.Cooldown(60 * 1000)
                // App.Core.Timeslice.Change("")
                App.Next();
                return
            }
            if (App.Data.Ask.Answers[0].Line.match(matcherTooMany)) {
                Quest.Cooldown(4 * 3600 * 1000)
                // App.Core.Timeslice.Change("")
                App.Next();
                return
            }
            if (App.Data.Ask.Answers[0].Line == "梁兴禄对你说道：嗯，既然你有心为衙门出力，我便给你个差事。") {
                Changan.All++;
                App.Send("changanjob")
                if (App.Data.Ask.Answers[1].Line == "梁兴禄说着便拿出一份公函交给你。") {
                    Changan.Gonghan()
                    return
                }
                Changan.Check2()
                return
            }
        }
        App.Fail()
    }
    let matcherCode = /^梁兴禄悄悄在你耳边说道：“其实(.+)的(.+)是我门衙门派在黑社会的卧底，$/
    let matcherCodeToken = /^\s+(\S+)$/
    Changan.Check2 = function () {
        let result = App.Data.Ask.Answers[1].Line.match(matcherCode)
        if (result) {
            Changan.Data.Name = result[2];
            for (var i = 3; i < App.Data.Ask.Answers.length; i++) {
                let token = App.Data.Ask.Answers[i].Line.match(matcherCodeToken)
                if (token) {
                    Changan.Data.Code += token[1].trim()
                } else {
                    break
                }
            }
            Changan.Data.Type = "code"
            Changan.DoCode()
            return
        } else {
            App.Log("未知的长安任务对话")
            Changan.Fail()
            return
        }
    }
    let matcherGonghanStart = /^\s+长安府公函$/
    let matcherTarget = /^(\s+.+\s*)$/
    let matcherAmbush = /^\s+据称，时下本城\s*$/
    let matcherAmbushEnd = /^\s+处野兽出没众多，可径去此处埋伏\(ambush\)等待予以诛杀。\s*$/
    let matcherPatrol = /^\s+需巡视各处地点如下:\s*$/
    let matcherPatrolEnd = /^\s+速去速回，不得有误\s*$/
    Changan.FormatTarget = function (targets) {
        let result = []
        targets.forEach(t => {
            if (t.endsWith("未巡")) {
                t = t.substring(0, t.length - 2)
            }
            let line = t.replaceAll("　", "").trim()
            if (line != "") {
                result.push(line)
            }
        })
        return result
    }
    const GonghanModeReady = 0
    const GonghanModeAmbush = 1
    const GonghanModePatrol = 2
    const GonghanModeFinish = -1
    let PlanGonghan = new App.Plan(App.Positions["Response"],
        (task) => {
            task.Data = {
                Start: false,
                Type: "",
                Target: [],
                Mode: GonghanModeReady,
            }
            task.AddTrigger(matcherGonghanStart, (tri, result) => {

                task.Data.Start = true
                return true
            })
            task.AddTrigger(matcherAmbushEnd, (tri, result) => {
                task.Data.Mode = GonghanModeFinish
                Note("埋伏信息结束")
                return true
            })
            task.AddTrigger(matcherPatrolEnd, (tri, result) => {
                if (task.Data.Mode == GonghanModePatrol) {
                    Note("巡逻信息结束")
                    task.Data.Mode = GonghanModeFinish
                }
                return true
            })
            task.AddTrigger(matcherTarget, (tri, result) => {
                switch (task.Data.Mode) {
                    case GonghanModeAmbush:
                    case GonghanModePatrol:
                        let data = result[1].replaceAll("  ", "　")
                        for (var i = 0; i < data.length; i++) {
                            if (task.Data.Target.length < i + 1) {
                                task.Data.Target.push("")
                            }
                            task.Data.Target[i] += data[i]
                        }
                        break
                }
                return true
            })
            task.AddTrigger(matcherAmbush, (tri, result) => {
                task.Data.Type = "ambush"
                Note("埋伏信息开始")
                task.Data.Mode = GonghanModeAmbush
                return true
            })
            task.AddTrigger(matcherPatrol, (tri, result) => {
                Note("巡逻信息开始")
                task.Data.Type = "patrol"
                task.Data.Mode = GonghanModePatrol
                return true
            })

            App.Send("read gong han")
            App.Sync()
        },
        (result) => {
            if (result.Task.Data.Start == false) {
                App.Log("读公函失败")
                Changan.Fail()
                return
            }
            switch (result.Task.Data.Type) {
                case "ambush":
                    Changan.Data.Type = "ambush"
                    Changan.Data.Target = Changan.FormatTarget(result.Task.Data.Target)
                    Changan.DoAmbush()
                    return
                case "patrol":
                    Changan.Data.Type = "patrol"
                    Changan.Data.Target = Changan.FormatTarget(result.Task.Data.Target)
                    Changan.DoPatrol()
                    return
            }
            App.Log("未知的公函类型")
            Changan.Fail()
            return
        }
    )
    Changan.LoadRooms = function (name) {
        let filter = App.Mapper.HMM.RoomFilter.New()
        filter.HasAnyName = [name]
        filter.HasAnyGroup = ["长安城"]
        let result = App.Mapper.Database.APISearchRooms(filter).map(room => room.Key)
        if (result.length == 0) {
            App.Log(`长安任务未知的房间 ${name}`)
        }
        return result
    }
    Changan.Gonghan = function () {
        PlanGonghan.Execute()
    }
    let matcherAmbuushNotarget = /你埋伏了半天，还是没有野兽出现，只得暂时放弃。/
    let matcherAmbushTarget = /^突然不知道从哪里蹿出来一只(.+)。$/
    let PlanAmbush = new App.Plan(App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matcherAmbuushNotarget).WithName("notarget")
            task.AddTrigger(matcherAmbushTarget, (tri, result) => {
                Changan.Data.Name = result[1].trim()
            }).WithName("ok")
            task.AddTimer(2000, () => {
                Note("埋伏中")
                return true
            })
            task.AddTimer(60000).WithName("timeout")
            $.RaiseStage("prepare")
            App.Send("yun recover;yun regenerate;ambush")
        },
        (result) => {
            switch (result.Name) {
                case "notarget":
                    $.Insert($.Function(Changan.DoAmbush))
                    $.Next()
                    return
                case "ok":
                    Changan.AmbushKill();
                    return
                case "timeout":
                    App.Log("埋伏超时")
                    Changan.Fail()
                    return
            }
        })
    Changan.DoAmbush = function () {
        let rooms = Changan.LoadRooms(Changan.Data.Target[0])
        if (rooms.length == 0) {
            Changan.Fail()
            return
        }
        $.PushCommands(
            $.Nobusy(),
            $.Prepare(),
            $.To(rooms, App.Core.HelpFind.Hepler),
            $.Nobusy(),
            $.Plan(PlanAmbush),
        )
        $.Next()
    }
    Changan.AmbushKill = function () {
        App.Look()
        $.PushCommands(
            $.Sync(),
            $.Function(() => {
                let id = ""
                let target = App.Map.Room.Data.Objects.FindByName(Changan.Data.Name).First()
                if (target) {
                    id = target.ID.toLowerCase()
                }
                $.Insert($.CounterAttack(id, App.NewCombat("changan").WithTags(`changan-ambush`)))
                $.Next()
            }),
            $.Function(Changan.Finish),
        )
        $.Next()
    }
    let matcherPatrolFinish = "你巡逻了半天，发现并无可疑之人。"
    let matcherPatrolTarget = /^突然周围行人大喊：抓贼，抓贼！你定睛一看，一个.+正四处奔逃。$/
    let PlanPatrol = new App.Plan(App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matcherPatrolFinish).WithName("finish")
            task.AddTrigger(matcherPatrolTarget).WithName("target")
            task.AddTimer(10 * 60 * 1000).WithName("timeout")
            task.AddTimer(2000, () => {
                Note("巡逻中")
                return true
            })
            App.Send("yun recover;yun regenerate;patrol")
        },
        (result) => {
            switch (result.Name) {
                case "finish":
                    Changan.Data.Target.shift()
                    $.Insert($.Function(Changan.DoPatrol))
                    $.Next()
                    return
                case "target":
                    App.Send("halt")
                    $.Insert(
                        $.Nobusy(),
                        $.Do("hp"),
                        $.Sync(),
                        $.Function(Changan.DoPatrol)
                    )
                    $.Next()
                    return
                case "timeout":
                    App.Log(`巡逻超时，目标位置${Changan.Data.Target[0]},实际位置${App.Map.Room.Name}`)
                    Changan.Fail()
                    return
            }
        })
    Changan.DoPatrol = function () {
        if (Changan.Data.Target.length == 0) {
            Changan.Finish()
            return
        }
        Note(`巡逻目标 ${Changan.Data.Target.join(",")}`)
        let rooms = Changan.LoadRooms(Changan.Data.Target[0])
        if (rooms.length == 0) {
            Changan.Fail()
            return
        }
        $.PushCommands(
            $.Nobusy(),
            $.Prepare(),
            $.To(rooms, App.Core.HelpFind.Hepler),
            $.Nobusy(),
            $.Plan(PlanPatrol),
        )
        $.Next()
    }
    Changan.DoCode = function () {
        let npc = App.Core.NPC.Other[Changan.Data.Name];
        if (!npc) {
            App.Log(`未知的长安npc${Changan.Data.Name}`)
            Changan.Fail()
            return
        }
        App.Zone.Wanted = $.NewIDLowerWanted(npc.ID)
        $.PushCommands(
            $.Nobusy(),
            $.To(npc.Loc[0]),
            $.Rooms(npc.Loc, App.Zone.Finder, App.Core.HelpFind.Hepler),
            $.Function(function () {
                App.Send(`whisper ${Changan.Data.Code} to ${npc.ID}`);
                Changan.Finish()
            })
        )
        $.Next()
    }
    App.Core.Quest.AppendInitor(() => {
        Changan.All = 0;
        Changan.Success = 0;
        Changan.Gifts = {};
    })

    let Quest = App.Quests.NewQuest("changanjob")
    Quest.Name = "长安"
    Quest.Desc = ""
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Group = "changanjob"
    Quest.OnHUD = () => {
        return [
            new App.HUD.UI.Word("长安任务:"),
            new App.HUD.UI.Word(Changan.Success, 5, true),
        ]
    }
    Quest.OnSummary = () => {
        return [
            new App.HUD.UI.Word("长:"),
            new App.HUD.UI.Word(Changan.Success, 5, true),
        ]
    }
    Quest.OnReport = () => {
        let gifts = Object.keys(Changan.Gifts).map((gift) => `${gift}*${Changan.Gifts[gift]}`).join(",")
        return [
            `长安-总数:${Changan.All} 成功:${Changan.Success} 当前:${Changan.Current}`,
            `长安-奖励:${gifts}`,
        ]
    }
    // 通过这次锻炼，
    // 你获得了二百九十七点经验，二百四十四点潜能，以及一点实战体会。
    // 门派贡献、江湖阅历以及威望也都有了不同程度的提高。
    //你已经连续完成了 37 个长安府任务，继续加油努力啊！
    let matcherSuccess = "梁兴禄对你道：嗯，这次任务完成得不错，本府现下便给你赏赐。"
    let matcherFail = "梁兴禄对你道：这点小事都办不好，你可太没用了。"
    let matcherGift = /^梁兴禄对你道：此次本府额外赏赐你一.(.+)，以资鼓励。$/
    let matcherCurrentQuest = /^你已经连续完成了\s+(\d+)\s+个长安府任务，继续加油努力啊！$/
    let matcherNoQuest = "你现在没有领取长安府的任务！"
    let PlanQuest = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matcherSuccess, function (tri, result) {
                Changan.Success++;
                return true
            })
            task.AddTrigger(matcherFail, function (tri, result) {
                App.Log("长安任务失败")
                return true
            })
            task.AddTrigger(matcherGift, function (tri, result) {
                let gift = result[1].trim()
                Changan.Gifts[gift] = (Changan.Gifts[gift] || 0) + 1
                return true
            })
            task.AddTrigger(matcherCurrentQuest, function (tri, result) {
                Changan.Current = parseInt(result[1])
                return true
            })
            task.AddTrigger(matcherNoQuest, function (tri, result) {
                Changan.Current = 0
                return true

            })
        })
    Quest.Start = function (data) {
        PlanQuest.Execute()
        Changan.Go()
    }
    Quest.GetReady = function (q, data) {
        return () => { Quest.Start(data) }
    }
    App.Quests.Register(Quest)

})