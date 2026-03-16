//区与模块
(function (App) {
    App.Zone = {}
    App.Zone.Maps = {}
    App.Zone.NPCDMaps = {}
    App.Zone.CiteList = [
        "洛阳",
        "北京",
        "长安",
        "开封",
        "中州",
        "苏州",
        "杭州",
        "襄阳",
        "扬州",
        "昆明",
        "荆州",
        "兰州",
        "成都",
        "福州",
        "灵州",
        "武功",
        "泉州",
        "华山",
        "佛山",
        "南海",
        "汝州",
        "嵩山",
        "凌霄",
        "五毒",
        "星宿",
        "天山",
        "关外",
        "终南",
        "大理",
        "西域",
    ];//全部区域列表，取前2字
    App.Zone.GetMap = function (name) {
        if (App.Zone.NPCDMaps[name] && App.Params.DisableNPCD.trim() != "t") {
            return App.Zone.NPCDMaps[name]
        }
        return App.Zone.Maps[name]
    }

    //将起点和路径传为带房间id的path
    let convertPath = function (fr, cmds) {
        return App.Map.TraceRooms(`${fr}`, ...cmds.split(";"))
    }
    let DefaultChecker = function (wanted) {
        return App.Map.Room.Data.Objects.FindByName(wanted.Target).First() || App.Map.Room.Data.Objects.FindByIDLower(wanted.Target).First()
    }
    let CheckerIDLower = function (wanted) {
        return App.Map.Room.Data.Objects.FindByIDLower(wanted.Target).First()
    }
    App.Zone.NameChecker = function (wanted) {
        let obj = App.Map.Room.Data.Objects.FindByName(wanted.Target).First()
        if (obj && obj.ID.indexOf(" ") > 0) {
            wanted.ID = obj.ID.toLowerCase()
            return obj
        }
        return null
    }
    //默认的下一步回调
    App.Zone.DefaultNext = function (map, move, wanted) {
        move.Walk(map)
    }
    //遍历目标结构
    class Wanted {
        constructor(target, zone) {
            this.Target = target
            this.Zone = zone
        }
        Target = ""//目标
        Name = ""//名字
        Zone = ""//区域
        ID = ""//ud
        Loc = null//位置
        OnFound = null//找到的回调
        SingleStep = false//是否单布
        Ordered = true//是否按顺序
        Next = App.Zone.DefaultNext//下一步的回调
        Checker = DefaultChecker//检查函数
        //链式调用
        WithID(id) {
            this.ID = id
            return this
        }
        //链式调用
        WithLoc(loc) {
            this.Loc = loc
            return this
        }
        //链式调用
        WithOnFound(found) {
            this.OnFound = found
            return this
        }
        //链式调用
        WithSingleStep(s) {
            // this.SingleStep = App.Params.NumStep <= 1
            this.SingleStep = s
            return this
        }
        //链式调用
        WithChecker(c) {
            this.Checker = c
            return this
        }
        //链式调用
        WithOrdered(o) {
            this.Ordered = o
            return this
        }
        //链式调用
        WithNext(next) {
            this.Next = next
            return this
        }
    }
    //创建新的遍历目标
    App.NewWanted = function (target, zone) {
        return new Wanted(target, zone)
    }
    //创建新的遍历目标，id部分大小写
    App.NewIDLowerWanted = function (target, zone) {
        return new Wanted(target, zone).WithChecker(CheckerIDLower)
    }
    //当前目标
    App.Zone.Wanted = null
    //注册用户队列
    App.UserQueue.UserQueue.RegisterCommand("#search", function (uq, data) {
        let result = SplitN(data, " ", 2)
        if (result.length != 2) {
            Note("#search 格式错误，应该为 #search 地区 NPC中文名")
            uq.Commands.Next()
            return
        }
        let npc = result[1]
        if (!npc) {
            npc = ""
        }
        let zone = result[0]
        let wanted = App.NewWanted(npc, zone)
        uq.Commands.Append(
            uq.Commands.NewFunctionCommand(function () { App.Zone.Search(wanted) }),
            uq.Commands.NewFunctionCommand(function () { uq.Next() }),
        )
        uq.Commands.Next()
    })
    //Finder路径初始化器
    App.Zone.Finder = function (move, map) {
        wanted = App.Zone.Wanted
        move.Option.MultipleStep = wanted.SingleStep != true
        move.OnRoom = function (move, map, step) {
            let item = wanted.Checker(wanted)
            if (item) {
                wanted.Name = item.GetData().Name
                wanted.ID = item.IDLower
                if (map.Room.ID) {
                    wanted.Loc = App.Map.Room.ID
                    Note(wanted.Target + " @ " + wanted.Loc)
                }
            }
            App.Core.HelpFind.OnRoom()
        }
        move.OnArrive = function (move, map) {
            if (wanted.Loc) {
                App.Map.FinishMove()
                return
            }
            wanted.Next(map, move, wanted)
        }
    }
    //search区域名方法
    App.Zone.Search = function (wanted, ...initiators) {
        let rooms = App.Zone.GetMap(wanted.Zone)
        if (!rooms) {
            PrintSystem("#search 地图未找到")
            App.Fail(`#search 地图 ${wanted.Zone} 未找到`)
            return
        }
        wanted.Ordered = rooms.Ordered
        App.Zone.SearchRooms(rooms.Rooms, wanted, ...initiators)
    }
    let filter = App.Mapper.HMM.RoomFilter.New()
    filter.RoomConditions = [App.Mapper.HMM.ValueCondition.New("maze", 1, false)]
    App.Zone.MazeRooms = App.Mapper.Database.APISearchRooms(filter).map(room => room.Key)
    App.Zone.RoomTags = []
    App.Zone.MazeRooms.forEach(room => {
        App.Zone.RoomTags.push(App.Map.NewRoomTag(room, "noshortcut", 1))//迷宫在遍历禁止飞走，保证探索每个房间
    })
    App.Zone.Tag = App.Map.NewTag("find", 1)
    App.Zone.MoveData = App.Map.NewMoveData("find", true)
    //search指定房间
    App.Zone.SearchRooms = function (rooms, wanted, ...initiators) {
        App.Zone.Wanted = wanted
        wanted.Loc = null
        let moveArgs = [rooms, App.Zone.Finder, ...App.Zone.RoomTags, App.Zone.Tag, App.Zone.MoveData, ...initiators]
        let move = wanted.Ordered ? App.Move.NewOrderedCommand(...moveArgs) : App.Move.NewRoomsCommand(...moveArgs)
        App.Commands.PushCommands(
            move,
            App.Commands.NewFunctionCommand(() => {
                if (App.Zone.Wanted.Loc && App.Zone.Wanted.Loc != App.Map.Room.ID) {
                    App.Commands.Insert(
                        App.Move.NewToCommand(App.Zone.Wanted.Loc)
                    )
                    if (App.Zone.Wanted.OnFound) { App.Zone.Wanted.OnFound() }
                }
                App.Next()
            }),
            App.Commands.NewFunctionCommand(() => {
                if (App.Zone.Wanted.Loc && !App.Zone.Wanted.ID) {
                    App.Send("id here")
                    App.Commands.Insert(
                        App.NewSyncCommand(),
                        App.Commands.NewFunctionCommand(() => {
                            if (App.Map.Room.Data.IDHere && App.Map.Room.Data.IDHere[wanted.Target]) {
                                wanted.ID = App.Map.Room.Data.IDHere[wanted.Target].toLowerCase()
                            }
                            App.Next()
                        })
                    )
                }
                App.Next()
            })
        )
        App.Next()
    }
    //注册#killin的用户队列
    App.UserQueue.UserQueue.RegisterCommand("#killin", function (uq, data) {
        let result = SplitN(data, " ", 2)
        if (result.length != 2) {
            Note("#search 格式错误，应该为 #search 地区 NPC中文名")
            uq.Commands.Next()
            return
        }
        let npc = result[1]
        if (!npc) {
            npc = ""
        }
        let zone = result[0]
        let wanted = App.NewWanted(npc, zone)
        uq.Commands.Append(
            App.NewPrepareCommand(""),
            uq.Commands.NewFunctionCommand(function () { App.Zone.Search(wanted) }),
            uq.Commands.NewFunctionCommand(function () {
                if (npc) {
                    if (App.Zone.Wanted.Loc && App.Zone.Wanted.ID) {
                        App.Commands.Insert(
                            App.NewKillCommand(App.Zone.Wanted.ID, App.NewCombat("userqueue"))
                        )
                    }
                }
                App.Next()
            }),
            uq.Commands.NewFunctionCommand(function () { uq.Next() }),
        )
        uq.Commands.Next()
    })


})(App)