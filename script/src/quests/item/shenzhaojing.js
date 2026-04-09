$.Module(function (App) {
    let Shenzhaojing = {}
    Shenzhaojing.Go = () => {
        $.PushCommands(
            $.Prepare(),
            $.To("item-yejuhua"),
            $.Do("get ye juhua;i"),
            $.Sync(),
            $.Function(Shenzhaojing.Check),
        )
        $.Next()
    }
    let PlanLing = new App.Plan(
        App.Positions["Response"],
        (task) => {
            task.Data = ""
            task.AddTrigger("凌霜华说道：我不是告诉你了吗？你记性也太那个了。", function (tri, result) {
                task.Data = "ok"
                return true
            })
            task.AddTrigger("凌霜华说道：啊！你是丁大哥的朋友啊！家父在花园里中了剧毒的金波旬花，你进去后屏住呼吸就可以了。", function (tri, result) {
                task.Data = "ok"
                return true
            })
            App.Send("ask ling shuanghua about 丁典")
            App.Sync()
        },
        (result) => {
            if (result.Task.Data != "ok") {
                $.PushCommands(
                    $.Path(["w", "w"]),
                    $.Function(() => {
                        App.Map.Room.ID = $.RID("item-juyou")
                        Note("拿花失败")
                        Quest.Cooldown(15 * 60 * 1000)
                        App.Fail()
                    })
                )
                $.Next()
                return
            }
            Shenzhaojing.GoDingdian()
        }
    )
    Shenzhaojing.GoDingdian = () => {
        $.PushCommands(
            $.Path(["n"]),
            $.Do("get lu juhua"),
            $.Path(["s", "w", "n", "e"]),
            $.Do("give lu juhua to ding dian;i"),
            $.Sync(),
            $.Function(() => {
                App.Map.Room.ID = $.RID("item-dingdian")
                Note("拿花结束")
                Quest.Cooldown(15 * 60 * 1000)
                App.Next()
            })
        )
        $.Next()

    }
    Shenzhaojing.Check = () => {
        if (App.Data.Item.List.FindByID("ye juhua").First() == null) {
            Quest.Cooldown(15 * 60 * 1000)
            Note("野菊花没刷")
            App.Fail()
            return
        }
        $.PushCommands(
            $.To("item-juyou", App.Move.KillBlockers(["衙役", "管家"])),
            $.Do("give ye juhua to juyou;i"),
            $.Sync(),
            $.Function(() => {
                if (App.Data.Item.List.FindByID("guifang key").First() == null) {
                    Quest.Cooldown(15 * 60 * 1000)
                    Note("闺房钥匙没刷")
                    App.Fail()
                    return
                }
                $.Next()
            }),
            $.Path(["e", "unlock men&e"]),
            $.Plan(PlanLing),
        )
        $.Next()
    }
    let Quest = App.Quests.NewQuest("shenzhaojing")
    Quest.Name = "拿神照经"
    Quest.Desc = ""
    Quest.Intro = "拿神照经"
    Quest.Help = ""
    Quest.Group = "item"
    App.Quests.Register(Quest)

    Quest.Start = function (data) {
        Shenzhaojing.Go()
    }
    Quest.GetReady = function (q, data) {
        App.Quests.Data.NoJiqu = true
        return () => { Quest.Start(data) };
    }

})