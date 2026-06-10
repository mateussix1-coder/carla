export function compressImageFile(file, maxWidth = 1080, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('A imagem selecionada não é válida.'))
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)

        const context = canvas.getContext('2d', { alpha: false })
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      image.src = reader.result
    }

    reader.readAsDataURL(file)
  })
}

export async function uploadImageFile(file, kind, apiRequest) {
  const dataUrl = await compressImageFile(file)
  return apiRequest('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ dataUrl, kind }),
  })
}
