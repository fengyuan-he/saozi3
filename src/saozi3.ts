import {create} from "random-seed";

const CONTENT_SIZE = 8
const PADDING_SIZE = 4
const DOUBLE_PADDING_SIZE = PADDING_SIZE << 1
const TOTAL_SIZE = CONTENT_SIZE + DOUBLE_PADDING_SIZE

function shuffle(count: number, seed: string) {
    const array = new Array<number>(count)
    for (let i = 0; i < count; i++) array[i] = i
    const rand = create(seed)
    for (let i = count - 1; i; i--) {
        const r = rand(i)
        const t = array[i]
        array[i] = array[r]
        array[r] = t
    }
    return array
}

function paste(data: Uint8ClampedArray, new_data: Uint8ClampedArray, index: number, new_index: number) {
    new_data[new_index] = data[index]
    new_data[new_index + 1] = data[index + 1]
    new_data[new_index + 2] = data[index + 2]
    new_data[new_index + 3] = data[index + 3]
}

function encryptX({data, width, height}: ImageData, seed: string) {
    const count = Math.ceil(width / CONTENT_SIZE) - 2
    const rest = width - count * CONTENT_SIZE
    const half = rest >> 1
    const new_width = count * TOTAL_SIZE + DOUBLE_PADDING_SIZE + rest
    const new_data = new Uint8ClampedArray(new_width * height * 4)
    const array = shuffle(count, seed)
    const copy = (index: number, new_index: number) => paste(data, new_data, index, new_index)
    for (let y = 0; y < height; y++) {
        for (let j = 0; j < half; j++) copy(
            (y * width + j) << 2,
            (y * new_width + j) << 2
        )
        {
            const index = (y * width + half - 1) << 2
            for (let j = 0; j < PADDING_SIZE; j++) copy(
                index,
                (y * new_width + half + j) << 2
            )
        }
        for (let i = 0; i < count; i++) {
            {
                const index = (y * width + half + i * CONTENT_SIZE) << 2
                for (let j = 0; j < PADDING_SIZE; j++) copy(
                    index,
                    (y * new_width + half + array[i] * TOTAL_SIZE + PADDING_SIZE + j) << 2
                )
            }
            for (let j = 0; j < CONTENT_SIZE; j++) copy(
                (y * width + half + i * CONTENT_SIZE + j) << 2,
                (y * new_width + half + array[i] * TOTAL_SIZE + DOUBLE_PADDING_SIZE + j) << 2
            )
            {
                const index = (y * width + half + i * CONTENT_SIZE + CONTENT_SIZE - 1) << 2
                for (let j = 0; j < PADDING_SIZE; j++) copy(
                    index,
                    (y * new_width + half + array[i] * TOTAL_SIZE + CONTENT_SIZE + DOUBLE_PADDING_SIZE + j) << 2
                )
            }
        }
        {
            const index = (y * width + half + count * CONTENT_SIZE) << 2
            for (let j = 0; j < PADDING_SIZE; j++) copy(
                index,
                (y * new_width + half + count * TOTAL_SIZE + PADDING_SIZE + j) << 2
            )
        }
        for (let j = half; j < rest; j++) copy(
            (y * width + count * CONTENT_SIZE + j) << 2,
            (y * new_width + count * TOTAL_SIZE + DOUBLE_PADDING_SIZE + j) << 2
        )
    }
    return new ImageData(new_data, new_width, height)
}

function encryptY({data, width, height}: ImageData, seed: string) {
    const count = Math.ceil(height / CONTENT_SIZE) - 2
    const rest = height - count * CONTENT_SIZE
    const half = rest >> 1
    const new_height = count * TOTAL_SIZE + DOUBLE_PADDING_SIZE + rest
    const new_data = new Uint8ClampedArray(width * new_height * 4)
    const array = shuffle(count, seed)
    const copy = (index: number, new_index: number) => paste(data, new_data, index, new_index)
    for (let x = 0; x < width; x++) {
        for (let j = 0; j < half; j++) copy(
            (j * width + x) << 2,
            (j * width + x) << 2
        )
        {
            const index = ((half - 1) * width + x) << 2
            for (let j = 0; j < PADDING_SIZE; j++) copy(
                index,
                ((half + j) * width + x) << 2
            )
        }
        for (let i = 0; i < count; i++) {
            {
                const index = ((half + i * CONTENT_SIZE) * width + x) << 2
                for (let j = 0; j < PADDING_SIZE; j++) copy(
                    index,
                    ((half + array[i] * TOTAL_SIZE + PADDING_SIZE + j) * width + x) << 2
                )
            }
            for (let j = 0; j < CONTENT_SIZE; j++) copy(
                ((half + i * CONTENT_SIZE + j) * width + x) << 2,
                ((half + array[i] * TOTAL_SIZE + DOUBLE_PADDING_SIZE + j) * width + x) << 2
            )
            {
                const index = ((half + i * CONTENT_SIZE + CONTENT_SIZE - 1) * width + x) << 2
                for (let j = 0; j < PADDING_SIZE; j++) copy(
                    index,
                    ((half + array[i] * TOTAL_SIZE + CONTENT_SIZE + DOUBLE_PADDING_SIZE + j) * width + x) << 2
                )
            }
        }
        {
            const index = ((half + count * CONTENT_SIZE) * width + x) << 2
            for (let j = 0; j < PADDING_SIZE; j++) copy(
                index,
                ((half + count * TOTAL_SIZE + PADDING_SIZE + j) * width + x) << 2
            )
        }
        for (let j = half; j < rest; j++) copy(
            ((count * CONTENT_SIZE + j) * width + x) << 2,
            ((count * TOTAL_SIZE + DOUBLE_PADDING_SIZE + j) * width + x) << 2
        )
    }
    return new ImageData(new_data, width, new_height)
}

function decryptX({data, width, height}: ImageData, seed: string) {
    const count = Math.ceil(width / TOTAL_SIZE) - 2
    const rest = width - count * TOTAL_SIZE - DOUBLE_PADDING_SIZE
    const half = Math.floor(rest / 2)
    const new_width = count * CONTENT_SIZE + rest
    const new_data = new Uint8ClampedArray(new_width * height * 4)
    const array = shuffle(count, seed)
    const copy = (index: number, new_index: number) => paste(data, new_data, index, new_index)
    for (let y = 0; y < height; y++) {
        for (let j = 0; j < half; j++) copy(
            (y * width + j) << 2,
            (y * new_width + j) << 2
        )
        for (let i = 0; i < count; i++) {
            for (let j = 0; j < CONTENT_SIZE; j++) copy(
                (y * width + half + array[i] * TOTAL_SIZE + DOUBLE_PADDING_SIZE + j) << 2,
                (y * new_width + half + i * CONTENT_SIZE + j) << 2
            )
        }
        for (let j = half; j < rest; j++) copy(
            (y * width + count * TOTAL_SIZE + DOUBLE_PADDING_SIZE + j) << 2,
            (y * new_width + count * CONTENT_SIZE + j) << 2
        )
    }
    return new ImageData(new_data, new_width, height)
}

function decryptY({data, width, height}: ImageData, seed: string) {
    const count = Math.ceil(height / TOTAL_SIZE) - 2
    const rest = height - count * TOTAL_SIZE - DOUBLE_PADDING_SIZE
    const half = Math.floor(rest / 2)
    const new_height = count * CONTENT_SIZE + rest
    const new_data = new Uint8ClampedArray(width * new_height * 4)
    const array = shuffle(count, seed)
    const copy = (index: number, new_index: number) => paste(data, new_data, index, new_index)
    for (let x = 0; x < width; x++) {
        for (let j = 0; j < half; j++) copy(
            (j * width + x) << 2,
            (j * width + x) << 2
        )
        for (let i = 0; i < count; i++) {
            for (let j = 0; j < CONTENT_SIZE; j++) copy(
                ((half + array[i] * TOTAL_SIZE + DOUBLE_PADDING_SIZE + j) * width + x) << 2,
                ((half + i * CONTENT_SIZE + j) * width + x) << 2
            )
        }
        for (let j = half; j < rest; j++) copy(
            ((count * TOTAL_SIZE + DOUBLE_PADDING_SIZE + j) * width + x) << 2,
            ((count * CONTENT_SIZE + j) * width + x) << 2
        )
    }
    return new ImageData(new_data, width, new_height)
}

export function encode(image: ImageData, seed: string) {
    return encryptY(encryptX(image, seed), seed)
}

export function decode(image: ImageData, seed: string) {
    return decryptX(decryptY(image, seed), seed)
}