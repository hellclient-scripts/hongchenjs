//迷宫模块
(function (App) {
    //南疆沙漠
    App.Map.RegisterMaze("南疆沙漠", App.Map.NewMaze().WithCheckEnter(
        function (maze, move, map, step) {
            if (map.Room.Name == "南疆沙漠") {
                maze.Data = { Step: step, Count: 0 }
                return true
            }
            return false
        }
    ).WithCheckEscaped(
        function (maze, move, map) {
            return map.Room.Name != "南疆沙漠"
        }
    ).WithWalk(
        function (maze, move, map) {

            let cmd = App.Move.Filterdir(maze.Data.Step.Command)
            maze.Data.Count = maze.Data.Count + 1
            if (maze.Data.Count % 3 == 0) {
                App.Eat(true)
                App.Send("hp")
            }
            map.TrySteps([cmd != maze.Data.Step.Command ? maze.Data.Step.CloneWithCommand(cmd) : maze.Data.Step])
        }
    ).WithGetRoomID(
        function (maze, move, map) {
            return App.Core.RoomsByName["南疆沙漠"][0]
        }
    ))
    //戈壁滩
    App.Map.RegisterMaze("戈壁滩", App.Map.NewMaze().WithCheckEnter(
        function (maze, move, map, step) {
            if (map.Room.Name == "戈壁滩") {
                maze.Data = { Step: step, Count: 0 }
                return true
            }
            return false
        }
    ).WithCheckEscaped(
        function (maze, move, map) {
            return map.Room.Name != "戈壁滩"
        }
    ).WithWalk(
        function (maze, move, map) {
            let cmd = App.Move.Filterdir(maze.Data.Step.Command)
            if (cmd == "e") {
                if (maze.Data.Count < 2) {
                    cmd = "s"
                } else if (maze.Data.Count % 2) {
                    cmd = "e"
                } else {
                    cmd = "s"
                }
            } else if (cmd == "w") {
                if (maze.Data.Count < 2) {
                    cmd = "w"
                } else if (maze.Data.Count % 2) {
                    cmd = "n"
                } else {
                    cmd = "w"
                }
            }
            maze.Data.Count = maze.Data.Count + 1
            map.TrySteps([cmd != maze.Data.Step.Command ? maze.Data.Step.CloneWithCommand(cmd) : maze.Data.Step])
        }
    ).WithGetRoomID(
        function (maze, move, map) {
            return App.Core.RoomsByName["戈壁滩"][0]
        }
    ))

    //桃花迷阵
    App.Map.RegisterMaze("桃花迷阵", App.Map.NewMaze().WithCheckEnter(
        function (maze, move, map, step) {
            if (map.Room.Name == "桃花迷阵") {
                maze.Data = step
                return true
            }
            return false
        }
    ).WithCheckEscaped(
        function (maze, move, map) {
            return map.Room.Name != "桃花迷阵"
        }
    ).WithWalk(
        function (maze, move, map) {
            App.Eat(true)
            let cmd = App.Move.Filterdir(maze.Data.Command)
            map.TrySteps([maze.Data.CloneWithCommand(cmd)])
        }
    ).WithGetRoomID(
        function (maze, move, map) {
            return App.Core.RoomsByName["桃花迷阵"][0]
        }
    ))
    const MaxDashamoStep = 15
    App.Map.RegisterMaze("大沙漠", App.Map.NewMaze().WithCheckEnter(
        function (maze, move, map, step) {
            if (map.Room.Name == "大沙漠") {
                maze.Data = { Step: step, Count: 0, cmd: App.Move.Filterdir(step.Command) }
                return true
            }
            return false
        }
    ).WithCheckEscaped(
        function (maze, move, map) {
            if (map.Room.Name != "大沙漠") {
                let findfinish = !(move.Data.find && maze.Data.Count < MaxDashamoStep)
                if (map.Room.Name == "丝绸之路" && maze.Data.cmd == "e") {
                    maze.Data.cmd = "w"
                    return findfinish && App.Move.Filterdir(maze.Data.Step.Command) == "e"
                }
                if (map.Room.Name == "戈壁" && maze.Data.cmd == "w") {
                    maze.Data.cmd = "e"
                    return findfinish && App.Move.Filterdir(maze.Data.Step.Command) == "w"
                }
                return true
            }
            return false
        }
    ).WithWalk(
        function (maze, move, map) {
            cmd = maze.Data.cmd
            // if (cmd != "e" && App.Mapper.CommonExits.indexOf(cmd) >= 0) {
            //     cmd = "w"
            // }
            maze.Data.Count = maze.Data.Count + 1
            if (true) {
                App.PushCommands(
                    App.Core.Heal.NewRestCommand(),
                    App.Commands.NewFunctionCommand(() => {
                        App.Eat(true)
                        App.Send("yun recover;yun regenerate;hp")
                        map.TrySteps([maze.Data.Step.CloneWithCommand(cmd)])
                    })
                )
            } else {
                App.PushCommands(
                    App.Commands.NewFunctionCommand(() => {
                        map.TrySteps([cmd != maze.Data.Step.Command ? maze.Data.Step.CloneWithCommand(cmd) : maze.Data.Step])
                    })
                )
            }
            App.Next()
        }
    ).WithGetRoomID(
        function (maze, move, map) {
            switch (App.Map.Room.Name){
                case "丝绸之路":
                    return App.Mapper.Database.APITrackExit("2838","e。")
                case "戈壁":
                    return App.Mapper.Database.APITrackExit("2838","w。")
            }
            return App.Core.RoomsByName["大沙漠"][0]
        }
    ))
    App.Map.RegisterMaze("圣湖", App.Map.NewMaze().WithCheckEnter(
        function (maze, move, map, step) {
            if (map.Room.Name == "圣湖") {
                maze.Data = step
                return true
            }
            return false
        }
    ).WithCheckEscaped(
        function (maze, move, map) {
            return map.Room.Name != "圣湖"
        }
    ).WithWalk(
        function (maze, move, map) {
            App.Eat(true)
            let cmd = App.Move.Filterdir(maze.Data.Command)
            map.TrySteps([maze.Data.CloneWithCommand(cmd)])
        }
    ).WithGetRoomID(
        function (maze, move, map) {
            return App.Core.RoomsByName["圣湖"][0]
        }
    ))

})(App)