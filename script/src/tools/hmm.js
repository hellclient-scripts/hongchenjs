(function (App) {
    let mapModule = App.RequireModule("helllibjs/map/map.js")
    App.Tools.HMM = {}
    App.Tools.HMM.FixRides=()=>{
        let shortcuts=App.Mapper.Database.APIListShortcuts(App.Mapper.HMM.APIListOption.New().WithGroups(["ride"]))
        shortcuts.forEach(shortcut=>{
        })
        Dump(shortcuts)
        App.Mapper.Database.APIInsertShortcuts(shortcuts)
    }
    App.Tools.HMM.Rides = () => {
        let room = App.Mapper.Database.APIListRooms(App.Mapper.HMM.APIListOption.New().WithKeys(["4178"]))[0];
        room.Exits.forEach((exit) => {
            if (exit.Command.startsWith("t ")) {
                let sc = App.Mapper.HMM.Shortcut.New();
                sc.Command = "rideto " + exit.Command.slice(2);
                sc.Key = sc.Command
                sc.To = exit.To
                sc.Cost = 2
                sc.Group = "ride"
                // sc.Conditions = room.Conditions
                App.Mapper.Database.APIInsertShortcuts([sc]);
                print(sc.Command + " => " + sc.To)
            }
            if (exit.Command.startsWith("t1 ")) {
                let sc = App.Mapper.HMM.Shortcut.New();
                sc.Command = "rideto1 " + exit.Command.slice(3);
                sc.Key = sc.Command
                sc.To = exit.To
                sc.Cost = 2
                sc.Group = "ride"
                // sc.Conditions = room.Conditions
                App.Mapper.Database.APIInsertShortcuts([sc]);
                print(sc.Command + " => " + sc.To)
            }
        })
    }
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
    App.Tools.HMM.GetPath = (from, to) => {
        let before = Date.now()
        // let result = App.Map.GetMapperPath(from, true, to);
        for (var i = 0; i < 10; i++) {
            let result = App.Mapper.Database.APIQueryPathAny([from], [to], App.Mapper.HMM.Context.New(), App.Mapper.HMM.MapperOptions.New())
        }
        print("耗时" + (Date.now() - before) / 10 + "ms")
    }
})(App)