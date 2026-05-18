$.Module(function (App) {
    let SleepNeili = {}
    SleepNeili.Next = function () {
        if (App.Data.Player.HP["内力上限"] < 1500) {
            if (App.Data.Player.HP["当前气血"] < App.Data.Player.HP["气血上限"] - 50) {
                $.Insert(
                    $.Nobusy(),
                    $.Prepare(),
                    $.To("action-sleepneili"),
                    $.Do("yun recover;sleep;hp"),
                    $.Sync(),
                    $.Function(SleepNeili.Next)
                )
            } else {
                $.Insert(
                    $.To("action-sleepneili"),
                    $.Do("yun recover;sleep;hp"),
                    $.Sync(),
                    $.Function(SleepNeili.Next)
                )
            }
        } else {
            $.Insert($.Nobusy())
        }
        $.Next()
    }
    let Quest = App.Quests.NewQuest("sleepneili")
    Quest.Name = "睡寒冰床"
    Quest.Desc = "睡寒冰床,提升内力"
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Start = function (data) {
        SleepNeili.Next()
    }
    Quest.GetReady = function (q, data) {
        if (App.Data.Player.HP["内力上限"] >= 1500) {
            return null
        }
        return () => { Quest.Start(data) }
    }
    App.Quests.Register(Quest)

})