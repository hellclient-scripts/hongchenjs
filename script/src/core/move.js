//移动模块
(function (App) {
    let mapModule = App.RequireModule("helllibjs/map/map.js")
    let dfsModule = App.RequireModule("helllibjs/map/dfs.js")
    //多步移动判断
    App.Map.Movement.MultipleStepConverter.Checker = function (step, index, move, map) {
        return index != 0 && dfsModule.Backward[step.Command] != null
    }
    //定位命令
    App.Map.Movement.DefaultLocateNext = (move, map, locate) => {
        //避免被关在房间里
        if (App.Map.Room.Exits.length == 0) {
            App.Send("open door;open gate")
        }
        return locate.MoveNext(move, map)
    }
    App.Map.Movement.CheckRoomCmd = "#l"
    App.Look = () => {
        App.Map.Room.Keep = true
        App.Send("l")
    }
    //注册#l别名
    App.Sender.RegisterAlias("#l", function (data) {
        App.Look()
    })
    //注册#sail别名，等到岸
    App.Sender.RegisterAlias("#sail", function (data) {
        $.RaiseStage("wait")
    })
    //移动模块切换指令
    App.Map.OnModeChange = (map, old, mode) => {
        if (mode == "locate") {
            App.Send("unset brief")
        } else {
            App.Send("set brief")
        }
    }
    App.Map.OnMoveDiscard = (move, map) => {
        App.RaiseEvent(new App.Event("core.movediscard"))
    }
    App.Move = {}
    App.Move.NoFlyUp = false
    App.Move.OnNoFlyUp = function (event) {
        App.Move.NoFlyUp = true
        App.Map.InitTags()
        App.RaiseEvent(event)
    }
    App.Engine.SetFilter("core.noflyup", App.Move.OnNoFlyUp)
    App.Move.OnNoFlyUpNow = function (event) {
        App.Map.Room.Data["core.noflyup"] = true
        App.Map.InitTags()
        App.RaiseEvent(event)
    }
    App.Engine.SetFilter("core.noflyupnow", App.Move.OnNoFlyUpNow)
    App.Move.OnBlocked2 = function (event) {
        event.Data = event.Data.Wildcards["0"]
        App.RaiseEvent(event)
    }
    App.Engine.SetFilter("core.blocked2", App.Move.OnBlocked2)
    App.Move._OnNextRoom = []
    App.Move.BindNextRoom = (callback) => {
        App.Move._OnNextRoom.push(callback)
    }
    let refilter = /[。·！*]/g;
    App.Move.Filterdir = function (dir) {
        dir = dir.replace(refilter, "");
        if (dir.indexOf("、") != -1) {
            dir = dir.split("、");
            dir = dir[dir.length - 1];
        }
        return dir
    }
    App.Move.FailedMessages = {}
    App.LoadLines("data/walkfailed.txt", "|").forEach(data => {
        App.Move.FailedMessages[data[1]] = data[0]
    })
    App.Move.BlockedMessages = {}
    App.LoadLines("data/walkblocked.txt", "|").forEach(data => {
        App.Move.BlockedMessages[data[1]] = data[0]
    })
    App.Move.BusyMessages = {}
    App.LoadLines("data/walkbusy.txt").forEach(data => {
        App.Move.BusyMessages[data] = true
    })
    App.Move.WalkRetryMessages = {}
    App.LoadLines("data/walkretry.txt").forEach(data => {
        App.Move.WalkRetryMessages[data] = true
    })
    //移动跟踪
    App.Map.Trace = function (map, rid, dir) {
        if (rid == "3527" && dir == "n") {
            dir = "break men&n"
        }
        var exits = App.Map.GetRoomExits(rid, true)
        var result = ""
        exits.forEach(function (path) {
            if (App.Move.Filterdir(path.Command) == App.Move.Filterdir(dir)) {
                result = path.To + ""
            }
        })
        return result
    }
    //创建固定路线移动
    App.Move.NewPath = function (path, ...initiators) {
        let pathlist = path.map(value => typeof value == "string" ? App.Map.NewStep(value) : value)
        return App.Map.NewRoute(new App.Map.Movement.Path(pathlist), ...initiators)
    }
    //创建定点路线移动
    App.Move.NewTo = function (target, ...initiators) {
        if (typeof target == "string") {
            target = target.split(",").map((val) => val.trim())
        }
        return App.Map.NewRoute(new App.Map.Movement.To(target), ...initiators)
    }
    //创建房间路线移动
    App.Move.NewRooms = function (rooms, ...initiators) {
        return App.Map.NewRoute(new App.Map.Movement.Rooms(rooms), ...initiators)
    }
    //创建固定房间移动
    App.Move.NewOrdered = function (rooms, ...initiators) {
        return App.Map.NewRoute(new App.Map.Movement.Ordered(rooms), ...initiators)
    }
    App.Move.LongtimeStepDelay = 30 * 1000
    App.Move.RetryStep = false
    //移动的计划，移动失败处理
    App.Map.StepPlan = new App.Plan(
        App.Map.Position,
        function (task) {
            task.Data = {
                logs: [],
            }
            App.Move.RetryStep = false
            let tt = task.AddTimer(App.Map.StepTimeout, function (timer) {
                return App.Map.OnStepTimeout()
            }).WithName("timeout")
            task.AddTimer(App.Move.LongtimeStepDelay, function (timer) {
                if (!App.Map.Move) {
                    return true;
                }
                let lastStep = App.Map.Move.GetLastStep()
                if (lastStep) {
                    if (lastStep.Command == "#sail") {
                        return true
                    }
                }
                return false
            }).WithName("timeout")
            task.AddCatcher("core.retrymove", function () {
                App.Move.RetryStep = true
                return true
            })
            task.AddCatcher("core.movereset").WithName("movereset")
            task.AddCatcher("core.wrongway").WithName("wrongway")
            task.AddCatcher("core.walkbusy").WithName("walkbusy")
            task.AddCatcher("core.walkresend").WithName("walkresend")
            task.AddCatcher("core.walkretry").WithName("walkretry")
            task.AddCatcher("core.walkretrylater").WithName("walkretrylater")
            task.AddCatcher("core.walkfail").WithName("walkfail")
            task.AddCatcher("core.blocked2", (catcher, event) => {
                if (App.Core.Room.Current.ID == "") {
                    return true;
                }
                catcher.WithData(event.Data)
            }).WithName("blocked2")
            task.AddCatcher("core.boatarrive", (catcher, event) => {
                App.Send("halt;out")
                return true
            }).WithName("boatarrive")
            task.AddCatcher("core.blocked", (catcher, event) => {
                catcher.WithData(event.Data)
            }).WithName("blocked")
            task.AddCatcher("core.moveblocked", (catcher, event) => {
                catcher.WithData(event.Data)
            }).WithName("moveblocked")
            task.AddCatcher("core.needrest").WithName("needrest")
            task.AddCatcher("line", function (catcher, event) {
                if (App.Params.LogDetail > 0 && task.Data.logs.length < App.Params.LogDetail) {
                    task.Data.logs.push(event.Data.Output)
                }
                if (App.Move.BusyMessages[event.Data.Output]) {
                    catcher.WithName("walkbusy")
                    return false
                }
                if (App.Move.FailedMessages[event.Data.Output] != undefined) {
                    if (App.Core.Room.Current.ID == "") {
                        if (App.Map.OnStepTimeout()) {
                            catcher.WithName("movereset")
                        }
                        return false;
                    }
                    catcher.WithName("blocked2").WithData(App.Move.FailedMessages[event.Data.Output])
                    return false
                }
                if (App.Move.BlockedMessages[event.Data.Output]) {
                    catcher.WithName("blocked")
                    catcher.WithData(App.Move.BlockedMessages[event.Data.Output])
                    return false
                }
                if (App.Move.WalkRetryMessages[event.Data.Output]) {
                    App.Move.RetryStep = true
                    return true;
                }
                return true;
            })
            task.AddCatcher("core.movediscard").WithName("movediscard")
        },
        function (result) {
            switch (result.Type) {
                case "cancel":
                    break
                default:
                    switch (result.Name) {
                        case "movediscard":
                            break
                        case "timeout":
                            if (!App.Map.Room.Data["timeoutlogged"]) {
                                App.Map.Room.Data["timeoutlogged"] = true
                                App.Core.Log.LogCurrent(`移动超时 RoomID: ${App.Map.Room.ID}`, result.Task.Data.logs.join("\n"))
                            }
                            App.Map.Resend(0)
                            break
                        case "movereset":
                            App.Map.Room.ID = ""
                            App.Map.Retry()
                            break
                        case "wrongway":
                            if (App.Move.RetryStep) {
                                App.Map.Resend()
                                return
                            }
                            if (!App.Map.Room.Data["wrongwaylogged"]) {
                                App.Log(`走错路了 RoomID: ${App.Map.Room.ID}`)
                                App.Map.Room.Data["wrongwaylogged"] = true
                                App.Core.Log.LogMore(JSON.stringify(App.Map.LastHistory))
                            }
                            App.Map.Room.ID = ""
                            App.Sync(() => {
                                App.Map.ResetMaze()
                                App.Map.Retry()
                            })
                            break
                        case "walkbusy":
                            App.Sync(() => {
                                App.Map.Resend()
                            })
                            break
                        case "walkresend":
                            App.Map.Resend(0)
                            break
                        case "walkretry":
                            App.Map.Retry()
                            break
                        case "walkretrylater":
                            App.Sync(() => {
                                App.Map.Retry()
                            })
                            break
                        case "blocked":
                            App.Move.OnBlocker(result.Data)
                            break
                        case "moveblocked":
                            App.Move.OnMoveBlocker(result.Data)
                            break
                        case "blocked2":
                            if (result.Data != "" && App.Map.Move.Data["core.killblockers"] && App.Map.Move.Data["core.killblockers"].includes(result.Data)) {
                                App.Move.OnBlocker(result.Data)
                                break
                            }
                            App.Core.Blocker.BlockStepRetry()
                            break
                        case "needrest":
                            App.Move.NeedRest()
                            break
                        case "walkfail":
                            App.Move.OnWalkFail()
                            break
                        default:
                    }
            }
        }
    )
    //移动休息(内力/体力不足)处理
    App.Move.NeedRest = function () {
        let snap = App.Map.Snap()
        App.Commands.Insert(
            App.Commands.NewDoCommand("yun recover;yun regenerate;hp"),
            App.NewSyncCommand(),
            App.Core.Heal.NewRestCommand(),
            App.Commands.NewFunctionCommand(() => {
                App.Map.Rollback(snap)
                App.Map.Resend(0)
            })
        )
        App.Next()

    }
    //移动失败处理
    App.Move.OnWalkFail = function (name) {
        $.RaiseStage("wait")
        App.Map.Position.Wait(1000, 0, () => {
            App.Send("halt")
            App.Core.Blocker.BlockStepRetry()
        })
    }
    //被拦截处理
    App.Move.OnBlocker = function (name) {
        App.Core.Blocker.KillBlocker(name)
    }
    App.Move.OnMoveBlocker = function (name) {
        if (App.Map.Move && App.Map.Move.Data["OnMoveBlocker"]) {
            App.Map.Move.Data["OnMoveBlocker"](name)
            return
        }
        App.Map.Room.Data["core.moveblocked"] = (App.Map.Room.Data["core.moveblocked"] || 0) + 1
        if (App.Map.Room.Data["core.moveblocked"] < 5) {
            App.Map.Resend()
        } else {
            App.Core.Blocker.KillMoveBlocker(name)
        }
    }
    App.Move.NewOnMoveBlocker = function (callback) {
        return App.Map.NewMoveData("OnMoveBlocker", callback)
    }
    App.Move.KillBlockers = function (npclist) {
        return App.Map.NewMoveData("core.killblockers", npclist)
    }
    //房间名回显
    App.BindEvent("core.roomentry", function (event) {
        if (App.Move._OnNextRoom.length > 0) {
            let cbs = App.Move._OnNextRoom
            App.Move._OnNextRoom = []
            cbs.forEach(callback => callback())
        }
        event.Context.ProposeLater(function () {
            App.Map.OnWalking()
            if (App.Params.ShowRoomID.trim() == "t") {
                Note(`R:${App.Map.Room.ID}`)
            }
        })
    })

    mapModule.DefaultOnFinish = function (move, map) {
        App.Next()
    }
    mapModule.DefaultOnCancel = function (move, map) {
        App.Fail()
    }
    //注册path指令
    App.Move.NewPathCommand = function (path, ...initiators) {
        return App.Commands.NewCommand("path", { Target: path, Initers: initiators })
    }
    App.Commands.RegisterExecutor("path", function (commands, running) {
        running.OnStart = function (arg) {
            let target = running.Command.Data.Target
            if (typeof (target) == "string") {
                target = target.split(",")
            }
            App.Move.NewPath(running.Command.Data.Target, ...running.Command.Data.Initers).Execute()
        }
    })
    //注册to指令
    App.Move.NewToCommand = function (target, ...initiators) {
        return App.Commands.NewCommand("to", { Target: target, Initers: initiators })
    }
    App.Commands.RegisterExecutor("to", function (commands, running) {
        running.OnStart = function (arg) {
            let target = running.Command.Data.Target
            if (typeof (target) == "string") {
                target = [target]
            }
            if (target) {
                target = App.Mapper.LoadMarkers(target)
                label = target.length > 1 ? `${target[0]} 等 ${target.length} 个房间` : target[0]
                Note(`${App.Map.Room.ID} 前往 ${label}`)
            }
            App.Move.NewTo(target, ...running.Command.Data.Initers).Execute()
        }
    })
    //注册rooms指令
    App.Move.NewRoomsCommand = function (target, ...initiators) {
        return App.Commands.NewCommand("rooms", { Rooms: target, Initers: initiators })
    }
    App.Commands.RegisterExecutor("rooms", function (commands, running) {
        running.OnStart = function (arg) {
            App.Move.NewRooms(running.Command.Data.Rooms, ...running.Command.Data.Initers).Execute()
        }
    })
    //注册ordered指令
    App.Move.NewOrderedCommand = function (target, ...initiators) {
        return App.Commands.NewCommand("ordered", { Rooms: target, Initers: initiators })
    }
    App.Commands.RegisterExecutor("ordered", function (commands, running) {
        running.OnStart = function (arg) {
            App.Move.NewOrdered(running.Command.Data.Rooms, ...running.Command.Data.Initers).Execute()
        }
    })
    //to别名
    App.Move.To = function (target) {
        App.Commands.Execute(App.Move.NewToCommand(target))
        App.Next()
    }
    //rooms别名
    App.Move.Rooms = function (rooms) {
        App.Commands.Execute(App.Move.NewRoomsCommand(rooms))
        App.Next()
    }
    //ordered别名
    App.Move.Ordered = function (rooms) {
        App.Commands.Execute(App.Move.NewOrderedCommand(rooms))
        App.Next()
    }
    //加载设置
    App.Move.Load = () => {
        App.Map.Movement.MaxStep = App.Params.NumStep
    }
    App.Move.Hooks = {}
    App.Move.HookEnter = (roomid, cb) => {
        if (!App.Move.Hooks[roomid]) {
            App.Move.Hooks[roomid] = []
        }
        if (!App.Move.Hooks[roomid].Enter) {
            App.Move.Hooks[roomid].Enter = []
        }
        App.Move.Hooks[roomid].Enter.push(cb)
    }
    App.Move.HookLeave = (roomid, cb) => {
        if (!App.Move.Hooks[roomid]) {
            App.Move.Hooks[roomid] = []
        }
        if (!App.Move.Hooks[roomid].Leave) {
            App.Move.Hooks[roomid].Leave = []
        }
        App.Move.Hooks[roomid].Leave.push(cb)
    }

    App.Move.ColdRooms = {}
    App.Move.EnterColdRoom = (step) => {
        if (App.Map.Room.ID && App.Move.ColdRooms[step.Target] && !App.Move.ColdRooms[App.Map.Room.ID]) {
            if (App.Core.Player.GetSkillLevenByID("force") < 300) {
                App.Send("yun recover")
                if ((App.Data.Item.List.FindByID("cutton padded").First() != null)) {
                    App.Send("remove cloth;wear cutton padded")
                }
            }
        }
    }
    App.Move.LeaveColdRoom = (step) => {
        if (App.Map.Room.ID && !App.Move.ColdRooms[step.Target] && App.Move.ColdRooms[App.Map.Room.ID]) {
            if (App.Core.Player.GetSkillLevenByID("force") < 300) {
                App.Send("yun recover")
                if ((App.Data.Item.List.FindByID("cutton padded").First() != null)) {
                    App.Send("remove cutton padded;hp")
                }
            }
        }
    }
    App.Move.LoadHooks = () => {
        App.Mapper.Database.APIListTraces(App.Mapper.HMM.APIListOption.New().WithKeys(["coldrooms"]))[0].Locations.forEach(item => {
            App.Move.ColdRooms[item] = true
            App.Move.HookEnter(item, App.Move.EnterColdRoom)
            App.Move.HookLeave(item, App.Move.LeaveColdRoom)
        })
    }
    App.Move.LoadHooks();
    App.Vehicle = new mapModule.Vehicle()
    App.Move.LastVehicleYanjiu = 0
    App.Vehicle.Send = function (step, map) {
        let now = $.Now()
        if ((App.Params.YanjiuPot - 0) > 0 && App.Data.Player.HP["潜能"] > (App.Params.YanjiuPot - 0)) {
            if (now - App.Move.LastVehicleYanjiu > 1000) {
                App.Move.LastVehicleYanjiu = now
                $.RaiseStage("moveyanjiu")
            }
        }
        if (step.Target && App.Move.Hooks[step.Target] && App.Move.Hooks[step.Target].Enter) {
            App.Move.Hooks[step.Target].Enter.forEach(cb => cb(step))
        }
        mapModule.DefaultVehicleSend(step, map)
        if (App.Map.Room.ID && App.Move.Hooks[App.Map.Room.ID] && App.Move.Hooks[App.Map.Room.ID].Leave) {
            App.Move.Hooks[App.Map.Room.ID].Leave.forEach(cb => cb(step))
        }
    }
    mapModule.DefaultVehicle = App.Vehicle
})(App)