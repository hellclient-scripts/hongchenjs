(function (App) {
    App.Emergencies.DeathProtect = {}
    App.Emergencies.DeathProtect.CheckInterval = 60 * 60 * 1000
    let PlanWait = new App.Plan(App.Positions.Connect,
        (task) => {
            Note("天书没了，发呆")
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

    App.Emergencies.DeathProtect.Wait = function () {
        $.Insert(
            $.To("chat"),
            $.Plan(PlanWait),
        )
        $.Next()
    }
    App.Emergencies.DeathProtect.Check = function () {
        $.Insert(
            $.Prepare(),
            $.Function(() => {
                App.Core.BoxItem.TryGet("wangqing tianshu")
            }),
            $.Function(() => {
                if (App.Data.Item.List.FindByID("wangqing tianshu").First() != null) {
                    App.Send("read wangqing tianshu;i;hp -m")
                    $.Insert($.Nobusy())
                } else {
                    PrintSystem("没wangqing tianshu了")
                    App.Emergencies.DeathProtect.LastTry = $.Now()
                    if (App.PolicyParams["deathprotect"] == "force") {
                        App.Emergencies.DeathProtect.Wait()
                        return
                    }
                }
                $.Next()
            })
        )
        $.Next()
    }
    App.Emergencies.DeathProtect.LastTry = 0
    App.Core.Quest.HeadReadyQueue.push(function () {
        if (App.Data.Player.HPM["死亡保护"] == false) {
            switch (App.PolicyParams["deathprotect"]) {
                case "try":
                    if ($.Now() - App.Emergencies.DeathProtect.LastTry > App.Emergencies.DeathProtect.CheckInterval) {
                        return App.Emergencies.DeathProtect.Check
                    }
                    break
                case "force":
                    return App.Emergencies.DeathProtect.Check
            }
            return null
        }
    })
})(App)