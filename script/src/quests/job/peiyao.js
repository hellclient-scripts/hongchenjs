//配药任务模块
$.Module(function (App) {
    let Peiyao = {}
    let jobs = {
        "平一指说道：好，你就帮我配药(peiyao)吧！喏，就这几味。": "peiyao",
        "平一指说道：让你干的活你干完了么？": "peiyao",
    }
    Peiyao.Start = function () {
        if (!App.Quests.Stopped) {
            $.PushCommands(
                $.Prepare("commonWithStudy"),
                // $.Timeslice("配药"),
                $.To("ping yizhi"),
                $.Ask("ping yizhi", "配药"),
                $.Function(() => {
                    let answer = App.Data.Ask.Answers[0]
                    if (answer) {
                        let cmd = jobs[answer.Line]
                        if (cmd) { App.Send(cmd) }
                    } else {
                        $.Insert($.Wait(3000))
                    }
                    App.Next()
                }),
                $.Nobusy(),
                $.Do("hp;i"),
                // $.Timeslice(""),
            )
        }
        App.Next()
    }
    //你获得了十一点经验和潜能。
    let matcherReward = /^你获得了(.+)点经验和潜能。$/
    let PlanQuest = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matcherReward, (tri, result) => {
                let exp = App.CNumber.ParseNumber(result[1])
                App.Core.Analytics.Add(Quest.ID, exp, exp, 0)
                return true
            })
        }
    )

    let Quest = App.Quests.NewQuest("peiyao")
    Quest.Name = "配药"
    Quest.Desc = "新人配药任务"
    Quest.Intro = ""
    Quest.Help = ""
    Quest.OnHUD = () => {
        return [
            new App.HUD.UI.Word("丹玉磨:"),
            new App.HUD.UI.Word(App.HUD.UI.ShortNumber(App.Data.Item.List.FindByIDLower("danyu mo").Sum()), 5, true),
        ]
    }
    Quest.OnSummary = () => {
        return [
            new App.HUD.UI.Word("磨:"),
            new App.HUD.UI.Word(App.HUD.UI.ShortNumber(App.Data.Item.List.FindByIDLower("danyu mo").Sum()), 5, true),
        ]
    }
    Quest.OnReport = () => {
        return [`配药-获得了 ${App.Data.Item.List.FindByIDLower("danyu mo").Sum()}个丹玉磨`]
    }

    Quest.Start = function (data) {
        PlanQuest.Execute()
        Peiyao.Start()
    }
    App.Quests.Register(Quest)
    App.Core.Analytics.RegisterTask(Quest.ID, Quest.Name, Quest.Timeslice ? Quest.Timeslice : Quest.Name)

})