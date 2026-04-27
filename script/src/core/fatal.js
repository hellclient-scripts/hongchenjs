//致命错误模块
(function (App) {
    App.FatalMode = 0
    App.Fatal = function (mod, msg, data) {
        PrintSystem(mod + " : " + msg)
    }
})(App)