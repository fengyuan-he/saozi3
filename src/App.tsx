import {AppBar, Box, Container, Toolbar, Typography} from "@mui/material";
import {decode, encode} from "./saozi3.ts";
import {useState} from "react";
import {decompressFrames, parseGIF} from "gifuct-js";
import GIF from "gif.js";

async function getImageData(input: HTMLInputElement) {
    const file = input.files?.[0]
    if (!file) throw new Error('请先选择图片')
    if (file.type === 'image/gif') {
        return decompressFrames(parseGIF(await file.arrayBuffer()), true)
            .map(({patch, dims: {width, height}, delay}) => ({data: new ImageData(patch, width, height), delay}))
    }
    const url = URL.createObjectURL(file)
    const img = document.createElement('img')
    await new Promise<void>((resolve, reject) => {
        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve()
        }
        img.onabort = () => {
            URL.revokeObjectURL(url)
            reject(new Error('图片解析失败'))
        }
        img.src = url
    })
    const canvas = document.createElement('canvas')
    const {width, height} = img
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, width, height)
    return ctx.getImageData(0, 0, width, height)
}

async function setImageData(image: { data: ImageData, delay: number }[] | ImageData) {
    let url: string
    if (Array.isArray(image)) {
        const gif = new GIF()
        image.forEach(({data, delay}) => gif.addFrame(data, {delay}))
        url = URL.createObjectURL(await new Promise<Blob>(resolve => {
            gif.on("finished", resolve)
            gif.render()
        }))
    } else {
        const canvas = document.createElement('canvas')
        const {width, height} = image
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')!
        ctx.putImageData(image, 0, 0)
        url = canvas.toDataURL()
    }
    const a = document.createElement('a')
    a.href = url
    a.download = ''
    a.click()
    URL.revokeObjectURL(url)
}

function encrypt(image: { data: ImageData, delay: number }[] | ImageData, seed: string) {
    if (Array.isArray(image)) {
        return image.map(({data, delay}) => ({data: encode(data, seed), delay}))
    }
    return encode(image, seed)
}

function decrypt(image: { data: ImageData, delay: number }[] | ImageData, seed: string) {
    if (Array.isArray(image)) {
        return image.map(({data, delay}) => ({data: decode(data, seed), delay}))
    }
    return decode(image, seed)
}

export default function App() {
    const [password, setPassword] = useState('')
    return (
        <>
            <AppBar color="secondary">
                <Toolbar>
                    <Typography variant="h6" component="div">
                        图片臊子3
                    </Typography>
                </Toolbar>
            </AppBar>
            <Toolbar/>
            <Container>
                <Typography>
                    第3代图片加解密技术，基于混沌置乱进行了改进，抗格式转换、抗有损压缩，视觉效果完美，无噪点、无彩纹
                </Typography>
                <Typography>
                    原本仅支持所有静态图片格式，现在新增了对gif格式动态图片的支持
                </Typography>
                <Box sx={{'& >*': {margin: 2}}}>
                    <div>
                        <label>
                            密码：
                            <input value={password} onChange={event => setPassword(event.target.value)}/>
                        </label>
                    </div>
                    <div>
                        <label>
                            加密：
                            <input type="file" accept="image/*" onChange={async event => {
                                try {
                                    await setImageData(encrypt(await getImageData(event.target as HTMLInputElement), password))
                                } catch (e) {
                                    console.error(e)
                                    alert(e)
                                }
                            }}/>
                        </label>
                    </div>
                    <div>
                        <label>
                            解密：
                            <input type="file" accept="image/*" onChange={async event => {
                                try {
                                    await setImageData(decrypt(await getImageData(event.target as HTMLInputElement), password))
                                } catch (e) {
                                    console.error(e)
                                    alert(e)
                                }
                            }}/>
                        </label>
                    </div>
                </Box>
            </Container>
        </>
    )
}