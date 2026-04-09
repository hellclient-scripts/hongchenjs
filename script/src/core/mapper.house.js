(function (App) {
    App.Mapper.AddPanlong = function (hosuename, houesid, houseloc, pass) {
        let passcmd = pass ? `typecode ${pass}、push、n。` : `push、n。`
        App.Mapper.HomeRooms = [
            App.Mapper.NewRoom("4199", `${hosuename}大院`, [
                App.Mapper.NewExit("n", "4200"),
                App.Mapper.NewExit("out", houseloc),
            ]),
            App.Mapper.NewRoom("4200", `${hosuename}前庭`, [
                App.Mapper.NewExit("e", "4201"),
                App.Mapper.NewExit(passcmd, "4203"),
                App.Mapper.NewExit("s", "4199"),
                App.Mapper.NewExit("w", "4202"),
            ]),
            App.Mapper.NewRoom("4202", `右卫舍*`, [
                App.Mapper.NewExit("e", "4200"),
            ]),
            App.Mapper.NewRoom("4201", `左卫舍*`, [
                App.Mapper.NewExit("w", "4200"),
            ]),
            App.Mapper.NewRoom("4203", `走道*`, [
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
        App.Mapper.Data.BuiltinMarkers["home"] = "4220"
        Note("添加房间别名 home 4220")
        App.Mapper.Data.BuiltinMarkers["ttg"] = "4214"
        Note("添加房间别名 ttg 4214")
        App.Mapper.Data.BuiltinMarkers["dazuo"] = "4214"
        Note("添加房间别名 dazuo 4214")
        App.Mapper.Data.BuiltinMarkers["sleep"] = "4214"
        Note("添加房间别名 sleep 4214")
        App.Mapper.Paths.push((() => {
            let model = App.Mapper.HMM.Path.New()
            model.From = App.Mapper.HouseLoc
            model.To = "4199"
            model.Command = `go ${App.Mapper.HouseID}`
            model.Conditions = [App.Mapper.NewCondition("streetview", 1, true)]
            return model;
        })())

    }
    App.Mapper.AddDule = function (hosuename, houesid, houseloc) {
        world.Note("在位置 " + houseloc + " 添加=独乐居房屋=" + hosuename + "入口(" + houesid + ")")
        App.Mapper.HouseID = houesid
        App.Mapper.HouseLoc = houseloc
        App.Mapper.HouseType = "dule"
        App.Mapper.HomeRooms = [
            App.Mapper.NewRoom("myroom-entry", `${hosuename}小院`, [
                App.Mapper.NewExit("open gate;n", "myroom-home"),
                App.Mapper.NewExit("out", houseloc),
            ]),
            App.Mapper.NewRoom("myroom-home", `${hosuename}小屋`, [
                App.Mapper.NewExit("open gate;s", "myroom-entry"),
            ]),
        ]
        App.Mapper.Data.BuiltinMarkers["home"] = "myroom-home"
        Note("添加房间别名 home myroom")
        App.Mapper.Data.BuiltinMarkers["dazuo"] = "myroom-entry"
        Note("添加房间别名 dazuo myroom-entry")
        App.Mapper.Data.BuiltinMarkers["sleep"] = "myroom-home"
        Note("添加房间别名 sleep myroom-home")

        App.Mapper.Paths.push((() => {
            let model = App.Mapper.HMM.Path.New()
            model.From = App.Mapper.HouseLoc
            model.To = "myroom-entry"
            model.Command = `go ${App.Mapper.HouseID}`
            model.Conditions = [App.Mapper.NewCondition("streetview", 1, true)]
            return model;
        })())
    }
    App.Mapper.AddCaihong = function (hosuename, houesid, houseloc) {
        world.Note("在位置 " + houseloc + " 添加=彩虹居房屋=" + hosuename + "入口(" + houesid + ")")
        App.Mapper.HouseID = houesid
        App.Mapper.HouseLoc = houseloc
        App.Mapper.HouseType = "caihong"
        App.Mapper.HomeRooms = [
            App.Mapper.NewRoom("myroom-entry", `${hosuename}小院`, [
                App.Mapper.NewExit("open gate;n", "myroom-living"),
                App.Mapper.NewExit("out", houseloc),
            ]),
            App.Mapper.NewRoom("myroom-living", `${hosuename}大厅`, [
                App.Mapper.NewExit("open east;e", "myroom-home"),
                App.Mapper.NewExit("n", "myroom-yard"),
                App.Mapper.NewExit("s", "myroom-entry"),
            ]),
            App.Mapper.NewRoom("myroom-yard", `${hosuename}后院`, [
                App.Mapper.NewExit("s", "myroom-living"),
            ]),
            App.Mapper.NewRoom("myroom-home", `${hosuename}卧室`, [
                App.Mapper.NewExit("w", "myroom-living"),
            ]),
        ]
        App.Mapper.Data.BuiltinMarkers["home"] = "myroom-home"
        Note("添加房间别名 home myroom")
        App.Mapper.Data.BuiltinMarkers["dazuo"] = "myroom-yard"
        Note("添加房间别名 dazuo myroom-yard")
        App.Mapper.Data.BuiltinMarkers["sleep"] = "myroom-yard"
        Note("添加房间别名 sleep myroom-yard")

        App.Mapper.Paths.push((() => {
            let model = App.Mapper.HMM.Path.New()
            model.From = App.Mapper.HouseLoc
            model.To = "myroom-entry"
            model.Command = `go ${App.Mapper.HouseID}`
            model.Conditions = [App.Mapper.NewCondition("streetview", 1, true)]
            return model;
        })())
    }

    App.Mapper.Addhouse = function (line) {
        if (line) {
            var data = line.trim().split(" ")
            if (data.length < 3 || data[0] == "") {
                world.Note("解析房屋信息失败，格式应该为 '机器人工厂 robot 4084' ")
                return
            }
            switch (data[0][0]) {
                case "p":
                case "P":
                    App.Mapper.AddPanlong(data[0].slice(1), data[1], data[2] ,data.length>3?data[3]:null)
                    break
                case "d":
                case "D":
                    App.Mapper.AddDule(data[0].slice(1), data[1], data[2])
                    break
                case "c":
                case "C":
                    App.Mapper.AddCaihong(data[0].slice(1), data[1], data[2])
                    break
                default:
                    App.Mapper.AddPanlong(data[0], data[1], data[2] ,data.length>3?data[3]:null)
            }
            App.Mapper.HomeRooms.forEach(room => { App.Mapper.RegisterRoom(room) })
        } else {
            world.Note("变量 house 未设置")
        }
    }
    App.Mapper.Addhouse(GetVariable("house"))

})(App)