$.Module(function (App) {
    let objectModule = App.RequireModule("helllibjs/object/object.js")
    let CleanHouse = {}
    CleanHouse.LastKey = ""
    CleanHouse.LastMax = ""
    CleanHouse.CheckUseless = () => {
        for (let item of App.Data.Box.List.Items) {
            let action = App.Core.Assets.Maintain(item)
            switch (action && action.Command) {
                case "#drop":
                case "#drophere":
                case "#sell":
                    return item
            }
        }
        return null
    }
    CleanHouse.Next = () => {
        $.PushCommands(
            $.Prepare(),
            $.To("home"),
            $.Function(App.Core.Item.CheckBox),
            $.Function(() => {
                let obj = CleanHouse.CheckUseless()
                if (obj) {
                    Note(`清理 [${obj.Key}] ${obj.Label}(${obj.ID})`)
                    let num = obj.Data.Count || 1
                    if (num > 50) {
                        num = 50
                    }
                    App.Send(`take ${obj.Key} ${num};i`)
                    CleanHouse.LastKey = obj.Key
                    CleanHouse.LastMax = App.Data.Box.List.Items[App.Data.Box.List.Items.length - 1].Key
                    $.Insert($.Sync(), $.Function(CleanHouse.Next))
                    $.Next()
                    return
                }
                Note("清理完毕")
                Quest.Cooldown(60000)
                $.Next()
            })
        )
        $.Next()
    }
    let Quest = App.Quests.NewQuest("cleanhouse")
    Quest.OnHUD = () => {
        return [
            new App.HUD.UI.Word("清理:"),
            new App.HUD.UI.Word(`${CleanHouse.LastKey}/${CleanHouse.LastMax}`, 5, true),
        ]
    }
    Quest.OnSummary = () => {
        return [
            new App.HUD.UI.Word("清"),
            new App.HUD.UI.Word(`${CleanHouse.LastKey}/${CleanHouse.LastMax}`, 5, true),
        ]
    }
    Quest.OnReport = () => {
        return [`清理箱子进度 ${CleanHouse.LastKey}/${CleanHouse.LastMax}`]
    }
    Quest.Name = "清理房间百宝箱"
    Quest.Desc = "根据战利品收纳规则对百宝箱里的物品进行清理"
    Quest.Intro = ""
    Quest.Help = ""
    Quest.Start = function (data) {
        CleanHouse.LastKey = ""
        CleanHouse.LastMax = ""
        CleanHouse.Next(data)
    }
    App.Quests.Register(Quest)
    App.Quests.CleanHouse = CleanHouse
})