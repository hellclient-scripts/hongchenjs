(function (App) {
    let mapModule = App.RequireModule("helllibjs/map/map.js")
    App.Tools.HMM = {}

    App.Tools.HMM.Maps = () => {
        Object.keys(App.Zone.Maps).forEach(key => {
            let route = App.Mapper.HMM.Route.New();
            route.Key = key;
            route.Rooms = App.Zone.Maps[key]
            route.Group = "quest";
            App.Mapper.Database.APIInsertRoutes([route]);
        })
    }
    App.Tools.HMM.Export = () => {
        MakeHomeFolder("")
        WriteHomeFile("export.hmm", App.Mapper.Database.Export())
    }
    App.Tools.HMMFixShortcuts = () => {
        let shortcuts = App.Mapper.Database.APIListShortcuts(App.Mapper.HMM.APIListOption.New())
        shortcuts.forEach(shortcut => {
            shortcut.RoomConditions = [App.Mapper.HMM.ValueCondition.New("noshortcut", 1, true)]
        })
        App.Mapper.Database.APIInsertShortcuts(shortcuts)
        App.Tools.HMM.Export()
    }
    App.Tools.HMM.GetPath = (from, to) => {
        let before = Date.now()
        // let result = App.Map.GetMapperPath(from, true, to);
        let result = App.Map.NewMove().GetPath(App.Map, from, to, false)
        NoteJSON(result)
    }
})(App)