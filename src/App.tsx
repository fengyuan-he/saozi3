import {
    AppBar,
    Backdrop,
    Box,
    Button,
    CircularProgress,
    Container,
    TextField,
    Toolbar,
    Typography
} from "@mui/material";
import {decode, encode} from "./saozi3.ts";
import {useEffect, useState} from "react";
import {decompressFrames, parseGIF} from "gifuct-js";
import GIF from "gif.js";
import {MuiFileInput} from "mui-file-input";

async function getImageData(file: File) {
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
    if (Array.isArray(image)) {
        const gif = new GIF()
        image.forEach(({data, delay}) => gif.addFrame(data, {delay}))
        return URL.createObjectURL(await new Promise<Blob>(resolve => {
            gif.on("finished", resolve)
            gif.render()
        }))
    }
    const canvas = document.createElement('canvas')
    const {width, height} = image
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    ctx.putImageData(image, 0, 0)
    return canvas.toDataURL()
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
    const [en, setEn] = useState<File | null>(null)
    const [de, setDe] = useState<File | null>(null)
    useEffect(() => {
        if (!en) return
        setDe(null)
        setLoading(true)
        ;(async () => {
            setUrl(await setImageData(encrypt(await getImageData(en), password)))
        })()
            .catch(reason => {
                console.error(reason)
                alert(reason)
            })
            .finally(() => setLoading(false))
    }, [en])
    useEffect(() => {
        if (!de) return
        setEn(null)
        setLoading(true)
        ;(async () => {
            setUrl(await setImageData(decrypt(await getImageData(de), password)))
        })()
            .catch(reason => {
                console.error(reason)
                alert(reason)
            })
            .finally(() => setLoading(false))
    }, [de])
    const [url, setUrl] = useState<string>()
    useEffect(() => {
        return () => {
            if (url !== undefined) URL.revokeObjectURL(url)
        }
    }, [url])
    const [loading, setLoading] = useState(false)
    return (
        <>
            <Backdrop open={loading} sx={(theme) => ({color: '#fff', zIndex: theme.zIndex.drawer + 1})}>
                <CircularProgress color="inherit"/>
            </Backdrop>
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
                <Typography gutterBottom>
                    原本仅支持所有静态图片格式，现在新增了对gif格式动态图片的支持
                </Typography>
                <Box sx={{'& >*': {m: 1}}}>
                    <TextField
                        multiline
                        label="密码"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                    />
                    <MuiFileInput
                        label="加密"
                        inputProps={{accept: 'image/*'}}
                        value={en}
                        onChange={setEn}
                    />
                    <MuiFileInput
                        label="解密"
                        inputProps={{accept: 'image/*'}}
                        value={de}
                        onChange={setDe}
                    />
                    {url !== undefined && <Button variant="contained" onClick={() => {
                        const a = document.createElement('a')
                        a.download = ''
                        a.href = url
                        a.click()
                    }}>保存输出</Button>}
                    <img alt="输出" src={url}/>
                </Box>
            </Container>
        </>
    )
}