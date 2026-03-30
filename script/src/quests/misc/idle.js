//发呆模块
$.Module(function (App) {
    let Idle = {}
    Idle.Start = (data) => {
        $.PushCommands(
            $.Timeslice("发呆"),
            $.Prepare(),
            $.Function(() => {
                if (App.Map.Room.ID != $.RID(data.trim())) {
                    $.Insert($.To(data))
                }
                $.Next()
            }),
            $.Wait(1000),
            // $.Timeslice(""),
        )
        App.Next()
    }
    let Quest = App.Quests.NewQuest("idle")
    Quest.Name = "在指定位置发呆"
    Quest.Desc = "在指定位置发呆"
    Quest.Intro = ""
    Quest.Help = ""
    Quest.GetReady = function (q, data) {
        if (!data) {
            data = "chat"
        }
        return () => {
            Quest.Start(data)
        }
    }

    Quest.Start = function (data) {
        Idle.Start(data)
    }
    App.Quests.Register(Quest)
})