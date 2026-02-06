//地图模块
(function (App) {
    let mapModule = App.RequireModule("helllibjs/map/map.js")
    App.Mapper = {}
    App.Mapper.Data = {}
    App.Mapper.Data.Markers = {}
    App.Mapper.CommonExits = ["west", "east", "south", "north", "up", "down", "enter", "out", "n", "s", "e", "w", "ne", "nw", "se", "sw", "u", "d", "northup", "northdown", "southup", "southdown", "eastup", "eastdown", "westup", "westdown", "nu", "nd", "eu", "ed", "wu", "wd", "su", "sd"]
    App.Mapper.HMM = mapModule.HMM
    App.Mapper.Database = mapModule.Database
    App.Core.RoomsByName = {}
    App.Mapper.HMM.HMMEncoder.DecodeRoomHook = (room) => {
        if (!App.Core.RoomsByName[room.Name]) {
            App.Core.RoomsByName[room.Name] = []
        }
        App.Core.RoomsByName[room.Name].push(room.Key)
        return room;
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
    })
    App.Mapper.LoadMarker = (key) => {
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
    App.Mapper.AddPanlong = function (hosuename, houesid, houseloc) {
        App.Mapper.HomeRooms = [
            App.Mapper.NewRoom("4199", `${hosuename}大院`, [
                App.Mapper.NewExit("n", "4200"),
                App.Mapper.NewExit("out", houseloc),
            ]),
            App.Mapper.NewRoom("4200", `${hosuename}前庭`, [
                App.Mapper.NewExit("e", "4201"),
                App.Mapper.NewExit("push、n。", "4203"),
                App.Mapper.NewExit("s", "4199"),
                App.Mapper.NewExit("w", "4202"),
            ]),
            App.Mapper.NewRoom("4202", `右卫舍`, [
                App.Mapper.NewExit("e", "4200"),
            ]),
            App.Mapper.NewRoom("4201", `左卫舍`, [
                App.Mapper.NewExit("w", "4200"),
            ]),
            App.Mapper.NewRoom("4203", `走道`, [
                App.Mapper.NewExit("n", "4204"),
                App.Mapper.NewExit("push、s。", "4200"),
            ]),
            App.Mapper.NewRoom("4204", `${hosuename}迎客厅`, [
                App.Mapper.NewExit("n", "4205"),
                App.Mapper.NewExit("s", "4203"),
            ]),
            App.Mapper.NewRoom("4205", `议事厅`, [
                App.Mapper.NewExit("e", "4207"),
                App.Mapper.NewExit("n", "4208"),
                App.Mapper.NewExit("s", "4204"),
                App.Mapper.NewExit("w", "4206"),
            ]),
            App.Mapper.NewRoom("4206", `${hosuename}武厅`, [
                App.Mapper.NewExit("e", "4205"),
            ]),
            App.Mapper.NewRoom("4207", `${hosuename}武厅`, [
                App.Mapper.NewExit("w", "4205"),
            ]),
            App.Mapper.NewRoom("4208", `${hosuename}中庭`, [
                App.Mapper.NewExit("open west、w", "4227"),
                App.Mapper.NewExit("n", "4209"),
                App.Mapper.NewExit("s", "4205"),
            ]),
            App.Mapper.NewRoom("4227", `左厢房`, [
                App.Mapper.NewExit("e", "4208"),
            ]),
            App.Mapper.NewRoom("4228", `右厢房`, [
                App.Mapper.NewExit("w", "4208"),
            ]),

            App.Mapper.NewRoom("4209", `后院`, [
                App.Mapper.NewExit("e", "4211"),
                App.Mapper.NewExit("n", "4212"),
                App.Mapper.NewExit("s", "4208"),
                App.Mapper.NewExit("w", "4210"),
            ]),
            App.Mapper.NewRoom("4210", `厨房`, [
                App.Mapper.NewExit("e", "4209"),
            ]),
            App.Mapper.NewRoom("4211", `厨房`, [
                App.Mapper.NewExit("w", "4209"),
            ]),
            App.Mapper.NewRoom("4212", `后花园`, [
                App.Mapper.NewExit("e", "4213"),
                App.Mapper.NewExit("s", "4209"),
                App.Mapper.NewExit("open door、w、close door", "4218"),
            ]),
            App.Mapper.NewRoom("4213", `竹林`, [
                App.Mapper.NewExit("e", "4214"),
                App.Mapper.NewExit("w", "4212"),
            ]),
            App.Mapper.NewRoom("4214", `听涛阁`, [
                App.Mapper.NewExit("w", "4213"),
            ]),
            App.Mapper.NewRoom("4218", `居所`, [
                App.Mapper.NewExit("open men&e", "4212"),
                App.Mapper.NewExit("w", "4219"),
                App.Mapper.NewExit("u", "4220"),
            ]),
            App.Mapper.NewRoom("4220", `卧室`, [
                App.Mapper.NewExit("d", "4218"),
            ]),
            App.Mapper.NewRoom("4219", `书房`, [
                App.Mapper.NewExit("e", "4218"),
            ]),

        ]
        world.Note("在位置 " + houseloc + " 添加=盘龙居房屋=" + hosuename + "入口(" + houesid + ")")
        App.Mapper.HouseID = houesid
        App.Mapper.HouseLoc = houseloc
        App.Mapper.HouseType = "panlong"
    }
    App.Mapper.Addhouse = function (line) {
        if (line) {
            var data = line.split(" ")
            if (data.length != 3) {
                world.Note("解析房屋信息失败，格式应该为 '机器人工厂 robot 4084' ")
                return
            }
            App.Mapper.AddPanlong(data[0], data[1], data[2])
        } else {
            world.Note("变量 house 未设置")
        }
    }
    App.Mapper.Addhouse(GetVariable("house"))

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

    if (App.Mapper.HouseID && App.Mapper.HouseLoc) {
        App.Mapper.Paths.push((() => {
            let model = App.Mapper.HMM.Path.New()
            model.From = App.Mapper.HouseLoc
            model.To = "4199"
            model.Command = App.Mapper.HouseID
            model.Conditions = [App.Mapper.NewCondition("streetview", 1, true)]
            return model;
        })())
    }


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
        // if (App.Mapper.InWinter()) {
        //     map.SetTag("winter", 1)
        //     map.BlockPath("1236", "1237")
        //     map.BlockPath("1238", "1237")
        // } else {
        //     map.SetTag("winter", 0)
        // }
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