(function (App) {
    App.Core.LineHooks = []
    App.Engine.SetFilter("line", function (event) {
        App.Core.LineHooks.forEach((hook) => {
            hook(event)
        });
        App.RaiseEvent(event)
    })
})(App)