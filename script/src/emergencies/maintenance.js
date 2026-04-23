(function (App) {
    App.Emergencies.Maintenance = {}
    App.Emergencies.Maintenance.FinishAt = 0
    let PlanWait = new App.Plan(App.Positions.Connect,
        (task) => {
            Note("开始等待")
            task.AddTimer(5000, function () {
                let left = ((App.Emergencies.Maintenance.FinishAt - $.Now()) / 1000).toFixed(0)
                Note(`等待维护 ${left} 秒`)
                return true
            })
            task.AddTimer(20000, function () {
                Send(" ")
                return true
            })

            task.AddTimer(App.Emergencies.Maintenance.FinishAt - $.Now(), function () {
                Note("维护结束")
                return false
            })
        }, (result) => {
            $.Next()
        }
    )
    App.Core.Quest.HeadReadyQueue.push(function () {
        let offset = App.Core.ServerTime.MaintenanceOffest()
        if (offset < App.Core.ServerTime.MaintenanceBefore && offset > App.Core.ServerTime.MaintenanceAfter) {
            App.Emergencies.Maintenance.FinishAt = $.Now() + (offset - App.Core.ServerTime.MaintenanceAfter) * 1000
            return function () {
                Note("等待维护")
                App.Insert(
                    $.Timeslice("等待维护"),
                    $.To("chat"),
                    $.Plan(PlanWait),
                    $.Timeslice("")
                )
                App.Next()
            }
        }
        return null
    })
    App.Core.Quest.FilterQueue.push(function (quests, quest) {
        let offset = App.Core.ServerTime.MaintenanceOffest()
        let space = quest.TimeCost ? quest.TimeCost : 0
        if (offset < App.Core.ServerTime.MaintenanceBefore + space && offset > App.Core.ServerTime.MaintenanceAfter) {
            return false
        }
        return true
    })
})(App)