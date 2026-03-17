$.Module(function (App) {

    //吕文焕对你说道：近有熊建妞在长安城一带活动，武林败类欺我大宋无人，请这位大侠为武林除害！
    //你喝道：我靠，给我回去再好好练练功夫吧！
    //熊海静死了。
    //吕文焕磨了磨牙。
    // 你向吕文焕打听有关『kill』的消息。
    // 吕文焕对手中名册一看，说：这位大师,任务皆已发放完毕,不妨先去歇息，汪剑通那里也许需要你。


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
        LastTihui: null,
        Gifts: {},
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
            task.AddTrigger(matcherTarget, (tri, result) => {
                Chujian.Data.Name = result[1]
                Chujian.Data.City = result[2].slice(0, 2)
                Chujian.Data.Times = 0
            }).WithName("target")
            task.AddTrigger(matcherLater, (tri, result) => {
                if (App.History.GetLast(2)[0].Line == matcherMe) {
                    Note("锄奸冷却中")
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
                Chujian.Data.Count++
                Chujian.GoKill()
                return
            }
            if (result.Name == "fangqi") {
                App.Send("ask lv wenhuan about fangqi")
                App.Insert($.Sync())
            } else {
                Quest.Cooldown(40000)
            }
            App.Next()
        }
    )
    let matcherGift = /^你得到了一级(.*)。$/
    let matcherExp = /^你得到了(.+)点武学经验和(.+)点潜能!体会和阅历,贡献也有所提高。$/
    let PlanCombat = new App.Plan(
        App.Positions["Combat"],
        (task) => {
            task.AddTrigger(`${Chujian.Data.Name}死了。`, (tri, result) => {
                Chujian.Data.Success++
                Chujian.Data.Name = ""
                Quest.Cooldown(40000)
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
            task.AddTrigger(matcherExp, (tri, result) => {
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
                    App.Commands.NewFunctionCommand(function () { App.Zone.Search(wanted) }),
                    App.Commands.NewFunctionCommand(Chujian.KillLoc),
                )
            } else {
                App.Log(`锄奸失败,放弃${Chujian.Data.Name}@${Chujian.Data.City}`)
            }
        } else {
            Note("锄奸成功")
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
        if (Chujian.Data.Name == "") {
            Note("结算")
            let tihui = App.Data.Player.HP["体会"] - Chujian.Data.LastTihui
            if (tihui > 0) {
                Chujian.Data.LastTihui = null
                Note(`体会增加${tihui}`)
                Chujian.Data.Tihui += tihui
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
            $.To("lv wenhuan"),
            $.Plan(PlanAsk),
        )
        App.Next()
    }
    Chujian.GetEff = function () {
        return Chujian.Data.Success * 3600 * 1000 / ($.Now() - Chujian.Data.Start)
    }
    Chujian.GetTihuiEff = function () {
        return Chujian.Data.Tihui * 3600 * 1000 / ($.Now() - Chujian.Data.Start)
    }

    Chujian.HelpRate = () => {
        return Chujian.Data.Success > 3 ? (Chujian.Data.helped * 100 / Chujian.Data.Success) : 0
    }
    App.BindEvent("core.helpfind.onfound", (event) => {
        let name = event.Data.Name
        let id = event.Data.ID
        let loc = event.Data.Loc
        if (Chujian.Data.Name == name) {
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
        return [`锄奸-总数:${Chujian.Data.Count} 成功:${Chujian.Data.Success} 效率:${Chujian.Data.Success > 3 ? Chujian.GetEff().toFixed(0) + "个/小时" : "-"} 体会 ${Chujian.Data.Tihui}  体会效率：${Chujian.Data.Success > 3 ? Chujian.GetTihuiEff().toFixed(0) + "点/小时" : "-"} 平均体会：${avg} 上次Exp:${Chujian.Data.LastExp} 线报率:${rate}`, `锄奸奖励:${gifts}`]
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
            City: "",
            Times: 0,
            LastExp: 0,
            LastTihui: null,
            Tihui: 0,
            Gifts: {},
            helped: 0,
            Start: $.Now(),
        }
    })
    App.Quests.Register(Quest)

    App.Quests.Chujian = Chujian
})