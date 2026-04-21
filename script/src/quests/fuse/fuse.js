$.Module(function (App) {
    const Stone1 = "chi shi"
    const Stone2 = "lan shi"
    const Stone3 = "hao shi"
    const Stone4 = "hui shi"
    let Fuse = {}
    Fuse.Target = 0
    Fuse.Current = 0
    Fuse.Fail = false
    Fuse.Finish = false
    App.Proposals.Register("quest.fuse", App.Proposals.NewProposal(function (proposals, context, exclude) {
        if (App.Data.Player.HP["内力上限"] < 5000) {
            return App.Core.BoxItem.EatLu
        }
        if (App.Data.Player.HP["精力上限"] < 300) {
            return App.Core.BoxItem.EatWan
        }
        if (App.Data.Player.HP["当前精力"] < 300) {
            return function () {
                App.Send("yun refresh;hp")
                $.Insert($.Nobusy())
                $.Next()
            }
        }
        return null
    }))
    App.Proposals.Register("commonWithQuestFuse", App.Proposals.NewProposalGroup("common", "quest.fuse"))

    Fuse.Next = function () {
        $.PushCommands(
            $.Prepare("commonWithQuestFuse", { NeiliMinNumber: 3000 }),
            $.Function(Fuse.Check),
            $.Function(Fuse.CheckFinish)

        )
        App.Next()
    }
    Fuse.CheckFinish = function () {
        if (Fuse.Current >= Fuse.Target || Fuse.Fail || App.Quests.Stopped) {
            if (!Fuse.Finish) {
                $.Insert(
                    $.Prepare(),
                    $.Function(Fuse.DoFinish)
                )
            }
        }
        $.Next()
    }
    Fuse.DoFinish = function () {
        Fuse.Finish = true
        let stone1sum = App.Data.Item.List.FindByIDLower(Stone1).Sum()
        let stone2sum = App.Data.Item.List.FindByIDLower(Stone2).Sum()
        let stone3sum = App.Data.Item.List.FindByIDLower(Stone3).Sum()
        let stone4sum = App.Data.Item.List.FindByIDLower(Stone4).Sum()
        if (stone1sum > 0) {
            $.Append(
                $.To("dp"),
                $.Do(`sell ${stone1sum} ${Stone1};i`),
                $.Nobusy(),
            )
        }
        if (stone2sum > 0) {
            $.Append(
                $.To("dp"),
                $.Do(`sell ${stone2sum} ${Stone2};i`),
                $.Nobusy(),
            )
        }
        if (stone3sum > 0) {
            $.Append(
                $.To("dp"),
                $.Do(`sell ${stone3sum} ${Stone3};i`),
                $.Nobusy(),
            )
        }
        if (stone4sum > 0) {
            $.Append(
                $.To("dp"),
                $.Do(`sell ${stone4sum} ${Stone4};i`),
                $.Nobusy(),
            )
        }
        $.Next()
    }
    Fuse.Check = function () {
        let stone1sum = App.Data.Item.List.FindByIDLower(Stone1).Sum()
        let stone2sum = App.Data.Item.List.FindByIDLower(Stone2).Sum()
        let stone3sum = App.Data.Item.List.FindByIDLower(Stone3).Sum()
        let stone4sum = App.Data.Item.List.FindByIDLower(Stone4).Sum()
        if (App.Data.Player.HP["内力上限"] < 5000 || App.Data.Player.HP["精力上限"] < 300) {
            Fuse.Fail = true
            App.Next()
            return
        }
        if (stone1sum > 0 && stone2sum > 0 && stone3sum > 0 && stone4sum > 0) {
            App.PushCommands(
                $.Do(`combine ${Stone1} & ${Stone2} & ${Stone3} & ${Stone4}`, true),
                $.Do("i;hp"),
                $.Nobusy(),
            )
            $.Next()
            return
        }
        // if (stone3sum == 0 && stone1sum > 2 && stone2sum > 2) {
        //     App.PushCommands(
        //         $.Do(`combine ${Stone1} & ${Stone2}`,true),
        //         $.Do("i;hp"),
        //         $.Nobusy(),
        //     )
        //     $.Next()
        //     return
        // }
        // if (stone4sum == 0 && stone1sum > 2 && stone3sum > 2) {
        //     App.PushCommands(
        //         $.Do(`combine ${Stone1} & ${Stone3}`,true),
        //         $.Do("i;hp"),
        //         $.Nobusy(),
        //     )
        //     $.Next()
        //     return
        // }
        $.PushCommands(
            $.Function(() => {
                App.Core.BoxItem.TryGet("magic stone")
            }),
            $.Function(() => {
                if (App.Data.Item.List.FindByID("magic stone").First() != null) {
                    App.Send("fuse magic stone;i;hp")
                    $.Insert($.Nobusy())
                } else {
                    App.Log("没magic stone了")
                    Fuse.Fail = true
                }
                $.Next()
            })
        )
        $.Next()
    }
    let Quest = App.Quests.NewQuest("fuse")
    Quest.OnHUD = () => {
        return [
            new App.HUD.UI.Word("溶化:"),
            new App.HUD.UI.Word(`${Fuse.Current}/${Fuse.Target}`, 5, true),
        ]
    }
    Quest.OnSummary = () => {
        return [
            new App.HUD.UI.Word("溶"),
            new App.HUD.UI.Word(`${Fuse.Current}/${Fuse.Target}`, 5, true),
        ]
    }
    Quest.OnReport = () => {
        return [`溶化进度 ${Fuse.Current}/${Fuse.Target}`]
    }
    Quest.Name = "溶化"
    Quest.Desc = "溶化magic stone，自动合成辉月华石"
    Quest.Intro = ""
    Quest.Help = ""
    let matcherFuse = /^你通过熔炼辉月华石的过程，从而获得了.+灵慧。$/
    //你通过合成辉月华石的历练过程，从而获得了一百点灵慧。
    let matcherCombine = /^你通过合成辉月华石的历练过程，从而获得了.+灵慧。$/
    let PlanQuest = new App.Plan(
        App.Positions["Quest"],
        (task) => {
            task.AddTrigger(matcherFuse, function () {
                Fuse.Current++
                return true
            })
            task.AddTrigger(matcherCombine, function () {
                Fuse.Current++
                return true
            })

        }
    )

    Quest.Start = function (data) {
        PlanQuest.Execute()
        Fuse.Next()
    }
    Quest.GetReady = function (q, data) {
        Fuse.Target = data - 0
        if (Fuse.Current >= Fuse.Target || Fuse.Fail || App.Quests.Stopped) {
            if (!Fuse.Finish) {
                return Fuse.DoFinish
            }
            return null
        }
        return () => { Quest.Start(data) }
    }
    App.Quests.Register(Quest)
    App.Quests.Fuse = Fuse
    App.Core.Quest.AppendInitor(() => {
        Fuse.Target = 0
        Fuse.Current = 0
        Fuse.Fail = false
        Fuse.Finish = false
    })
})