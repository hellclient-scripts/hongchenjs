//工具类
(function (App) {
    let utilsModule = App.RequireModule("helllibjs/utils/utils.js")
    App.Utils = utilsModule
    App.Random = App.Utils.Random
    //加载多行文本文件
    App.LoadLines = function (file, sep) {
        return App.LoadLinesText(ReadLines(file), sep)
    }
    //加载多行共享文本文件
    App.LoadSharedLines = function (file, sep, intro) {
        if (!world.ReadSharedLines) {
            Note(`当前Hellclient版本不支持读取共享${intro}文件`)
            return []
        }
        if (!HasSharedFile(file)) {
            Note(`未找到共享${intro}文件 game/shared/${App.ScriptID}/${file}`)
            return []
        }
        Note(`加载共享${intro}文件 ${file}`)
        return App.LoadLinesText(ReadSharedLines(file), sep)
    }
    App.LoadSharedFile = function (file, intro) {
        if (!world.ReadSharedFile) {
            Note(`当前Hellclient版本不支持读取共享${intro}文件`)
            return []
        }
        if (!HasSharedFile(file)) {
            Note(`未找到共享${intro}文件 game/shared/${App.ScriptID}/${file}`)
            return ""
        }
        Note(`加载共享${intro}文件 ${file}`)
        return ReadSharedFile(file)
    }
    //加载变量
    App.LoadVariable = function (name, sep) {
        return App.LoadLinesText(GetVariable(name).split("\n"), sep)
    }
    //加载文本，去除注释和空行
    App.LoadLinesText = function (data, sep) {
        let result = []
        data.forEach(line => {
            line = line.trim()
            if (line == "" || line.startsWith("//")) {
                return
            }
            if (sep) {
                result.push(line.split(sep))
            } else {
                result.push(line)
            }
        })
        return result
    }
})(App)