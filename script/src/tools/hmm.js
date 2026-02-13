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
    App.Tools.HMM.FixNPCDExit = () => {
        let rooms = App.Mapper.Database.APIListRooms(App.Mapper.HMM.APIListRoomsOptions.New())
        rooms.forEach(room => {
            if (room.Exits) {
                room.Exits.forEach(exit => {
                    if (exit.Command.indexOf("ask ") || exit.Command.indexOf("goto ") || exit.Command.indexOf("cross") || exit.Command.indexOf("yell ")) {

                    }
                })
            }
        })
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