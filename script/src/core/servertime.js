(function (App) {
    App.Core.ServerTime = {
    }
    App.Core.ServerTime.Offset = 0
    App.Core.ServerTime.MaintenanceHour = 6 * 3600
    App.Core.ServerTime.MaintenanceMinute = 0 * 60
    App.Core.ServerTime.MaintenanceBefore = 30
    App.Core.ServerTime.MaintenanceAfter = -45
    App.Core.ServerTime.MaintenanceOffest = function () {
        let now = new Date((new Date()).getTime() + App.Core.ServerTime.Offset)
        let time = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
        let d = App.Core.ServerTime.MaintenanceHour + App.Core.ServerTime.MaintenanceMinute - time
        if (d < 0) { d += 86400 }
        return d
    }
    App.BindEvent("core.servertime", function (event) {
        Dump(event.Data.Wildcards)
        var year = App.CNumber.ParseNumber(event.Data.Wildcards[0])
        var month = App.CNumber.ParseNumber(event.Data.Wildcards[1]) - 1
        var day = App.CNumber.ParseNumber(event.Data.Wildcards[2])
        var hour = App.CNumber.ParseNumber(event.Data.Wildcards[3])
        var minute = App.CNumber.ParseNumber(event.Data.Wildcards[4])
        var second = App.CNumber.ParseNumber(event.Data.Wildcards[5])
        let servertime = new Date(year, month, day, hour, minute, second).getTime()
        let localtime = (new Date()).getTime()
        App.Core.ServerTime.Offset = servertime - localtime
        Note(`服务器时间 ${new Date(servertime).toLocaleString()}，本地时间 ${new Date(localtime).toLocaleString()}，偏移 ${App.Core.ServerTime.Offset}ms`)
    })
})(App)