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
    App.Tools.HMMFixShortcuts=()=>{
        let shortcuts = App.Mapper.Database.APIListShortcuts(App.Mapper.HMM.APIListOption.New())
        shortcuts.forEach(shortcut => {
            shortcut.RoomConditions=[App.Mapper.HMM.ValueCondition.New("find",1,true),App.Mapper.HMM.ValueCondition.New("maze",1,true)]
        })
        App.Mapper.Database.APIInsertShortcuts(shortcuts)
        App.Tools.HMM.Export()
    }
    App.Tools.HMM.GetPath = (from, to) => {
        let before = Date.now()
        // let result = App.Map.GetMapperPath(from, true, to);
        for (var i = 0; i < 10; i++) {
            let result = App.Mapper.Database.APIQueryPathAny([from], [to], App.Mapper.HMM.Context.New(), App.Mapper.HMM.MapperOptions.New())
        }
        print("耗时" + (Date.now() - before) / 10 + "ms")
    }
})(App)