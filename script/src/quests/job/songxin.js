$.Module(function (App) {
    let Songxin = {}
    Songxin.NPC = ""
    let matcherNPC = /^在.+内把信送给『(.+)』你的任务就完成了。$/
    let matcherCancel = "信使对你说：你得把信帮我送到呀。"
    let matcherCooldown = "信使对你说：现在没信可以送，你还是等会再来吧。"
    let PlanSongxin = new App.Plan(
        App.Positions["Response"],
        (task) => {
            task.Data = ""
            Songxin.NPC = ""
            task.AddTrigger(matcherNPC, function (tri, result) {
                Songxin.NPC = result[1]
                task.Data = "ok"
                return true
            })
            task.AddTrigger(matcherCancel, function (tri, result) {
                task.Data = "cancel"
                return true
            })
            task.AddTrigger(matcherCooldown, function (tri, result) {
                task.Data = "cooldown"
                return true
            })
            App.Send("songxin")
            App.Sync()
        },
        (result) => {
            switch (result.Task.Data) {
                case "ok":
                    Songxin.Go()
                    Quest.Cooldown(10000)
                    return
                case "cancel":
                    Songxin.Fail()
                    return
                case "cooldown":
                    Quest.Cooldown(10000)
                    App.Next()
                    return
            }
            App.Log("未知的送信结果")
        });
    Songxin.Go = function () {
        let npc = App.Core.NPC.Other[Songxin.NPC];
        if (!npc) {
            App.Log(`未知的Songxin npc${Songxin.NPC}`)
            Songxin.Fail()
            return
        }
        App.Zone.Wanted = $.NewIDLowerWanted(npc.ID)
        $.PushCommands(
            $.Nobusy(),
            $.To(npc.Loc[0], App.Core.HelpFind.Hepler),
            $.Rooms(npc.Loc, App.Zone.Finder, App.Core.HelpFind.Hepler),
            $.Function(() => {
                if (App.Map.Room.Data.Objects.FindByIDLower(npc.ID).First() == null) {
                    App.Log(`没有找到NPC${Songxin.NPC}`)
                    Songxin.Fail()
                    return
                }
                $.Next()
            }),
            $.Do(`songxin ${npc.ID};hp`),
            $.Sync(),
        )
        $.Next()

    }
    Songxin.Fail = function () {
        $.PushCommands(
            $.To("xin deguo"),
            $.Ask("xin deguo", "取消"),
            $.Do("give 1 gold to xin deguo;i"),
            $.Sync(),
        )
        $.Next()
    }
    Songxin.Start = function () {
        if (!App.Quests.Stopped) {
            $.PushCommands(
                $.Prepare("commonWithStudy"),
                $.To("xin deguo"),
                $.Plan(PlanSongxin),
            )
        }
        App.Next()
    }
    let Quest = App.Quests.NewQuest("songxin")
    Quest.Name = "送信"
    Quest.Desc = "新人送信任务"
    Quest.Intro = ""
    Quest.Help = ""
    // Quest.OnHUD = () => {
    //     return [
    //         new App.HUD.UI.Word("丹玉磨:"),
    //         new App.HUD.UI.Word(App.HUD.UI.ShortNumber(App.Data.Item.List.FindByIDLower("danyu mo").Sum()), 5, true),
    //     ]
    // }
    // Quest.OnSummary = () => {
    //     return [
    //         new App.HUD.UI.Word("磨:"),
    //         new App.HUD.UI.Word(App.HUD.UI.ShortNumber(App.Data.Item.List.FindByIDLower("danyu mo").Sum()), 5, true),
    //     ]
    // }
    // Quest.OnReport = () => {
    //     return [`配药-获得了 ${App.Data.Item.List.FindByIDLower("danyu mo").Sum()}个丹玉磨`]
    // }

    Quest.Start = function (data) {
        Songxin.Start()
    }
    App.Quests.Register(Quest)
    App.Core.Analytics.RegisterTask(Quest.ID,Quest.Name,Quest.Timeslice ? Quest.Timeslice : Quest.Name)

})