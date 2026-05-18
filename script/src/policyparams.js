(function () {
    let paramsModule = App.RequireModule("helllibjs/params/params.js")//使用params库,定义统一格式的可配置参数
    App.PolicyParams = {
    }
    App.PolicyNamedParams = new paramsModule.Params(App.PolicyParams)

    App.PolicyNamedParams.AddString("reborn", "").WithName("重生后的操作").WithDesc("死亡后的后续操作").WithData([
        { Name: "退出", Value: "" },
        { Name: "检查保护", Value: "check" },
        { Name: "强制继续", Value: "force" },
    ])
    App.PolicyNamedParams.AddString("deathprotect", "").WithName("死亡保护").WithDesc("死亡保护的策略").WithData([
        { Name: "无视", Value: "" },
        { Name: "尝试天书", Value: "try" },
        { Name: "必须保护", Value: "force" },
    ])
    App.PolicyNamedParams.AddNumber("eatlu", 0).WithName("自动吃露").WithDesc("内力不足这个值时会尝试自动吃露，0为不吃")
    App.PolicyNamedParams.AddString("breakup", "").WithName("自动闭关").WithDesc("自动闭关策略").WithData([
        { Name: "关闭", Value: "" },
        { Name: "开启", Value: "t" },
    ])
    App.PolicyNamedParams.AddString("mingsi", "").WithName("自动冥思").WithDesc("自动冥思策略").WithData([
        { Name: "关闭", Value: "" },
        { Name: "开启", Value: "t" },
    ])
    App.PolicyNamedParams.AddString("godlight", "").WithName("天神之光").WithDesc("使用天神之光的策略").WithData([
        { Name: "无视", Value: "" },
        { Name: "尝试使用", Value: "try" },
        { Name: "必须使用", Value: "force" },
    ])
})()