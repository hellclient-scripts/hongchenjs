(function (App) {
    let addon_js_path = "addon.js"
    function LoadAddonJS(file, intro) {
        if (!world.ReadSharedFile) {
            Note(`当前Hellclient版本不支持读取共享${intro}文件`)
            return []
        }
        if (!HasSharedFile(file)) {
            Note(`未找到共享${intro}文件 game/shared/${App.ScriptID}/${file}`)
            return ""
        }
        Note(`加载共享${intro}文件 ${file}`)
        eval(ReadSharedFile(file), file)
    }
    LoadAddonJS(addon_js_path, "扩展js")
    let mods = GetModInfo()
    if (mods.Exists) {
        Note("模组功能已开启")
        mods.FolderList.forEach(function (mod) {
            if (HasModFile(mod + "/index.js")) {
                Note(`加载模组 ${mod}`)
                eval(ReadModFile(mod + "/index.js"), mod + "/index.js")
            }
        })
    } else {
        Note("未找到或者未开启模组")
    }
})(App)