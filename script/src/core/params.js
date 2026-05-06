//参数加载模块
(function (App) {
    let actionModule = App.RequireModule("helllibjs/conditions/action.js")
    App.Core.Params = {}
    App.Core.Params.Data = {}
    App.Core.Params.QuestData = {}
    App.Core.Params.PolicyData = {}
    App.Core.Params.Shared = {}
    App.Core.Params.Shared.Params = App.LoadSharedLines("params.txt", null, "自定义系统参数")
    App.Core.Params.Shared.Items = App.LoadSharedLines("items.txt", null, "自定义items")
    App.Core.Params.Shared.Assets = App.LoadSharedLines("assets.txt", null, "自定义assets")
    App.Core.Params.Shared.House = App.LoadSharedFile("house.txt", "全局房屋设置")
    App.Core.Params.Shared.Dummy = App.LoadSharedFile("house_dummy.txt", "全局大米设置")
    App.Core.Params.Shared.QuestParams = App.LoadSharedLines("quest_params.txt", null, "自定义任务参数")
    App.Core.Params.Shared.PolicyParams = App.LoadSharedLines("policy_params.txt", null, "自定义决策参数")
    App.Core.Params.Load = () => {
        App.Core.Params.Data = {}
        App.Core.Params.QuestData = {}
        App.Core.Params.PolicyData = {}
        App.Core.Params.Shared.Params.concat(App.LoadVariable("params")).forEach(data => {
            let action = actionModule.Parse(data)
            if (action.Command) {
                App.Core.Params.Data[action.Command.slice(1)] = action.Data
            }
        })
        App.NamedParams.SetStringValues(App.Core.Params.Data)
        App.Core.Params.Shared.QuestParams.concat(App.LoadVariable("quest_params")).forEach(data => {
            let action = actionModule.Parse(data)
            if (action.Command) {
                App.Core.Params.QuestData[action.Command.slice(1)] = action.Data
            }
        })
        App.QuestNamedParams.SetStringValues(App.Core.Params.QuestData)
        App.Core.Params.Shared.PolicyParams.concat(App.LoadVariable("policy_params")).forEach(data => {
            let action = actionModule.Parse(data)
            if (action.Command) {
                App.Core.Params.PolicyData[action.Command.slice(1)] = action.Data
            }
        })
        App.PolicyNamedParams.SetStringValues(App.Core.Params.PolicyData)

    }
    //设置参数函数，第一个参数为变量名,第二个参数为变量值
    App.Core.Params.Set = (id, val) => {
        let result = []
        let matched = false
        App.LoadVariable("params").forEach(data => {
            let action = actionModule.Parse(data)
            if (action.Command == `#${id}`) {
                if (val) {
                    matched = true
                    result.push(`#${id} ${val}`)
                }
            } else {
                result.push(data)
            }
        })
        if (!matched && val) {
            result.push(`#${id} ${val}`)
        }
        SetVariable("params", result.join("\n"))
        App.ReloadVariable()
    }
    //设置任务参数函数，第一个参数为变量名,第二个参数为变量值
    App.Core.Params.SetQuest = (id, val) => {
        let result = []
        let matched = false
        App.LoadVariable("quest_params").forEach(data => {
            let action = actionModule.Parse(data)
            if (action.Command == `#${id}`) {
                if (val) {
                    matched = true
                    result.push(`#${id} ${val}`)
                }
            } else {
                result.push(data)
            }
        })
        if (!matched && val) {
            result.push(`#${id} ${val}`)
        }
        SetVariable("quest_params", result.join("\n"))
        App.ReloadVariable()
    }
    //设置决策参数函数，第一个参数为变量名,第二个参数为变量值
    App.Core.Params.SetPolicy = (id, val) => {
        let result = []
        let matched = false
        App.LoadVariable("policy_params").forEach(data => {
            let action = actionModule.Parse(data)
            if (action.Command == `#${id}`) {
                if (val) {
                    matched = true
                    result.push(`#${id} ${val}`)
                }
            } else {
                result.push(data)
            }
        })
        if (!matched && val) {
            result.push(`#${id} ${val}`)
        }
        SetVariable("policy_params", result.join("\n"))
        App.ReloadVariable()
    }
    //加载参数
    App.Core.Params.Load()
})(App)