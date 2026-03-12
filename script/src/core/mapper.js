//地图模块
(function (App) {
    let mapModule = App.RequireModule("helllibjs/map/map.js")
    App.Mapper = {}
    App.Mapper.Data = {}
    App.Mapper.Data.NPCList = []
    App.Mapper.Data.NPCMap = {}
    App.Mapper.Data.BuiltinMarkers = {}
    App.Mapper.Data.Markers = {}
    App.Mapper.CommonExits = ["west", "east", "south", "north", "up", "down", "enter", "out", "n", "s", "e", "w", "ne", "nw", "se", "sw", "u", "d", "northup", "northdown", "southup", "southdown", "eastup", "eastdown", "westup", "westdown", "nu", "nd", "eu", "ed", "wu", "wd", "su", "sd", "northeast", "northwest", "southeast", "southwest", "ne", "nw", "se", "sw"]
    App.Mapper.HMM = mapModule.HMM
    App.Mapper.Database = mapModule.Database
    App.Core.RoomsByName = {}
    App.Mapper.HMM.HMMEncoder.DecodeRoomHook = (room) => {
        App.Mapper.RegisterRoom(room)
        return room;
    }
    App.Mapper.RegisterRoom = (room) => {
        if (!App.Core.RoomsByName[room.Name]) {
            App.Core.RoomsByName[room.Name] = []
        }
        App.Core.RoomsByName[room.Name].push(room.Key)
    }
    var mappath = "map/hongchen.hmm"
    var maploaded = false;
    if (App.Core.Params.Data["MapEditing"] == "t") {
        Note("地图编辑模式已开启，加载 export.hmm")
        if (HasHomeFile("export.hmm")) {
            Note("找到地图文件export.hmm,加载中...")
            mappath = "export.hmm";
            mapModule.Database.Import(ReadHomeFile("export.hmm"))
            maploaded = true;
        } else {
            Note("未找到地图文件export.hmm，请确认文件存在！")
        }
    }
    if (!maploaded) {
        Note("加载地图文件" + mappath)
        mapModule.Database.Import(ReadFile(mappath))
    }
    mapModule.Database.APIListMarkers(mapModule.HMM.APIListOption.New()).forEach((marker) => {
        App.Mapper.Data.Markers[marker.Key] = marker.Value
        if ((marker.Group == "npc")) {
            let data = marker.Message.split("|")
            marker.Name = data[0]
            marker.ID = data[1]
            App.Mapper.Data.NPCList.push(marker)
            App.Mapper.Data.NPCMap[marker.Key] = marker
            App.Mapper.Data.NPCMap[marker.Name] = marker
        }
    })
    App.Mapper.LoadMarker = (key) => {
        if (App.Mapper.Data.BuiltinMarkers[key]) {
            return App.Mapper.Data.BuiltinMarkers[key]
        }
        if (App.Mapper.Data.Markers[key]) {
            return App.Mapper.Data.Markers[key]
        }
        return key;
    }
    App.Mapper.LoadMarkers = (keys) => {
        return keys.map(App.Mapper.LoadMarker)
    }
    App.Mapper.HouseID = null
    App.Mapper.HouseLoc = null
    App.Mapper.HouseType = null
    //添加房子
    App.Mapper.HomeRooms = []
    App.Mapper.Paths = []
    App.Mapper.NewCondition = function (tag, value = 1, not = false) {
        return App.Mapper.HMM.ValueCondition.New(tag, value, not)
    }
    App.Mapper.NewExit = function (command, to, cost = 1) {
        let model = App.Mapper.HMM.Exit.New()
        model.Command = command
        model.To = to
        model.Cost = cost
        return model
    }
    App.Mapper.NewRoom = function (key, name, exits = []) {
        let model = App.Mapper.HMM.Room.New()
        model.Key = key
        model.Name = name
        model.Exits = exits
        return model
    }
    _re = /·/g;
    //加载额外出口
    // App.LoadLines("data/exits.h", "|").forEach((data) => {
    //     App.Mapper.AddPath(data[0], data[1])
    // })
    // (() => {
    //     App.Mapper.Paths.push((() => {
    //         let model = App.Mapper.HMM.Path.New()
    //         model.From = "1236"
    //         model.To = "1237"
    //         model.Command = "cross"
    //         model.Conditions = [App.Mapper.NewCondition("winter")]
    //         return model;
    //     })())
    //     App.Mapper.Paths.push((() => {
    //         let model = App.Mapper.HMM.Path.New()
    //         model.From = "1237"
    //         model.To = "1236"
    //         model.Command = "cross"
    //         model.Conditions = [App.Mapper.NewCondition("winter")]
    //         return model;
    //     })())
    // })



    // App.Engine.SetFilter("core.wintercross", function (event) {
    //     App.Mapper.Data.Winter = (new Date()).getTime()
    //     App.RaiseEvent(event)
    // })
    // App.Engine.SetFilter("core.nowintercross", function (event) {
    //     App.Mapper.Data.Winter = null
    //     App.RaiseEvent(event)
    // })
    App.Engine.SetFilter("core.walkrest", function (event) {
        App.Send("yun recover")
        App.RaiseEvent(event)
    })
    App.Engine.SetFilter("core.unwield", function (event) {
        App.Send("#unwield")
        App.RaiseEvent(event)
    })
    App.Engine.SetFilter("core.walkfail", function (event) {
        App.Send("#unwield")
        App.RaiseEvent(event)
    })
    App.Mapper.ExcludeRooms = {}
    //扩展房间，第一个参数为房间id数组，第二个参数为膨胀多少格。
    App.Mapper.ExpandRooms = (rooms, expand, common) => {
        var opt = App.Mapper.HMM.MapperOptions.New()
        if (common) {
            opt.WithCommandWhitelist(App.Mapper.CommonExits)
        }
        return App.Mapper.Database.APIDilate(rooms, expand, App.Mapper.Database.Context, opt)
    }
    App.Mapper.InWinter = function () {
        // return App.Mapper.Data.Winter ? (new Date().getTime() - App.Mapper.Data.Winter) < 100000 : false
    }

    App.Mapper.InitTag = function (map) {
        if (App.Mapper.HomeRooms.length) {
            map.AddTemporaryRooms(App.Mapper.HomeRooms)
        }
        if (App.Mapper.Paths.length) {
            App.Mapper.Paths.forEach((p) => {
                map.AddTemporaryPath(p)
            })
        }
    }
    App.Mapper.Landmarkes = {}
    App.Mapper.Landmarkes.DesclineMap = {}
    App.Mapper.Database.APIListLandmarks(App.Mapper.HMM.APIListOption.New()).forEach((landmark) => {
        switch (landmark.Type) {
            case "descline":
                App.Mapper.Landmarkes.DesclineMap[landmark.Value] = landmark.Key
                break;
        }
    })
    App.Map.AppendInitiator(App.Mapper.InitTag)
    //额外地图定位
    let PlanLocate = new App.Plan(
        App.Positions["Room"],
        (task) => {
            task.AddCatcher("core.onexit")
            task.AddCatcher("line", function (catcher, event) {
                if (App.Mapper.Landmarkes.DesclineMap[event.Data.Output]) {
                    catcher.WithData(App.Mapper.Landmarkes.DesclineMap[event.Data.Output])
                    return false
                }
                return true;
            })
            task.AddTimer(3000)
        },
        (result) => {
            if (result.Data != null) {
                App.Core.Room.Current.ID = result.Data
            }
        }
    )
    App.BindEvent("core.roomname", () => {
        if (!App.Map.Room.ID) {
            PlanLocate.Execute()
        }
    })
    App.Map.AppendInitiator((map) => {
        for (var key in App.Data.Player.Skills) {
            let skill = App.Data.Player.Skills[key]
            if (skill["基本"] == skill.ID) {
                map.SetTag("skill-" + skill.ID, skill["等级"])
            }
        }
    })

})(App)