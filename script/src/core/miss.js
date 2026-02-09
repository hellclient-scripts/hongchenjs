(function (App) {
    let tagMiss = "miss"
    let vc = App.Mapper.HMM.ValueCondition.New(tagMiss, 1, false)
    App.Core.Miss = {}
    App.Core.Miss.ModeNormal = 0
    App.Core.Miss.ModeNeedStab = 1
    App.Core.Miss.Mode = App.Core.Miss.ModeNormal
    App.Core.Miss.Weapons = []
    App.Core.Miss.Shortcuts = []
    App.Core.Miss.AddWeapon = (id, loc) => {
        App.Core.Miss.Weapons.push({ ID: id, Loc: loc })
        let shortcut = App.Mapper.HMM.Shortcut.New()
        shortcut.Key = `miss-${id}`
        shortcut.Group = "miss"
        shortcut.Command = `miss ${id}`
        shortcut.To = loc
        shortcut.Cost = 2
        shortcut.Conditions.push(vc)
        App.Core.Miss.Shortcuts.push(shortcut)
    }
    App.LoadVariable("miss_list", "|").forEach(data => {
        if (data.length < 2) {
            Note(`错误的miss_list数据：${data}`)
            return
        }
        App.Core.Miss.AddWeapon(data[0], data[1])
    })
    App.Engine.SetFilter("core.missfail", (event) => {
        App.Core.Miss.Mode = App.Core.Miss.ModeNeedStab
        App.RaiseEvent(event)
    })
    App.Core.Miss.CanMiss = function () {
        return App.Core.Miss.Mode == App.Core.Miss.ModeNormal ? 1 : 0
    }
    App.Map.AppendInitiator(function () {
        App.Map.Context.WithShortcuts(App.Core.Miss.Shortcuts)
        App.Map.SetTag(tagMiss, App.Core.Miss.CanMiss())
    })
})(App)