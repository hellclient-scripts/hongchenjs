(function (App) {
    App.Emergencies.GodLight = {}
    App.Emergencies.GodLight.CheckInterval = 60 * 60 * 1000
    let PlanWait = new App.Plan(App.Positions.Connect,
        (task) => {
            Note("天神之光没了，发呆")
            task.AddTimer(20000, function () {
                Send(" ")
                return true
            })

            task.AddTimer(300000, function () {
                Note("再去试试")
                return false
            })
        }, (result) => {
            $.Next()
        }
    )

    App.Emergencies.GodLight.Wait = function () {
        $.Insert(
            $.To("chat"),
            $.Plan(PlanWait),
        )
        $.Next()
    }
    App.Emergencies.GodLight.Check = function () {
        $.Insert(
            $.Prepare(),
            $.Function(() => {
                App.Core.BoxItem.TryGet("god light")
            }),
            $.Function(() => {
                if (App.Data.Item.List.FindByID("god light").First() != null) {
                    App.Send("use god light;i;doubletime")
                    $.Insert($.Nobusy())
                } else {
                    PrintSystem("没god light了")
                    App.Emergencies.GodLight.LastTry = $.Now()
                    if (App.PolicyParams["godlight"] == "force") {
                        App.Emergencies.GodLight.Wait()
                        return
                    }
                }
                $.Next()
            })
        )
        $.Next()
    }
    App.Emergencies.GodLight.LastTry = 0
    App.Core.Quest.HeadReadyQueue.push(function () {
        if (!App.Data.Player.InDoubleTime) {
            switch (App.PolicyParams["godlight"]) {
                case "try":
                    if ($.Now() - App.Emergencies.GodLight.LastTry > App.Emergencies.GodLight.CheckInterval) {
                        return App.Emergencies.GodLight.Check
                    }
                    break
                case "force":
                    return App.Emergencies.GodLight.Check
            }
            return null
        }
    })
})(App)