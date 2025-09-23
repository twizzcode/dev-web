# Twizz Cutter - Server-Side Image Processing

## Fitur Baru

Aplikasi ini sekarang mendukung 2 mode pemrosesan gambar:

### 1. **Client-Side Processing** (Default sebelumnya)
- Semua pemrosesan dilakukan di browser pengguna
- Tidak memerlukan server resources
- Cocok untuk gambar berukuran kecil-menengah

### 2. **Server-Side Processing** (Baru)
- Pemrosesan dilakukan di server menggunakan Sharp library
- Lebih cepat dan efisien untuk gambar besar
- Hemat memory browser
- Optimal untuk hosting di Vercel

## Hosting di Vercel

### Persiapan Deployment

1. **Install Dependencies**
   ```bash
   npm install sharp
   ```

2. **Konfigurasi File**
   - `next.config.ts`: Sudah dikonfigurasi untuk Sharp
   - `vercel.json`: Sudah dikonfigurasi dengan timeout 60 detik
   - API Route: `/app/api/crop/route.ts`

### Deployment Steps

1. **Push ke GitHub**
   ```bash
   git add .
   git commit -m "Add server-side image processing"
   git push origin main
   ```

2. **Deploy ke Vercel**
   - Connect repository di Vercel dashboard
   - Vercel akan otomatis detect Next.js project
   - Build dan deploy akan automatic

### Limitasi Vercel

| Plan | Function Timeout | Memory Limit | Bandwidth |
|------|------------------|--------------|-----------|
| Hobby (Free) | 10s | 1024MB | 100GB |
| Pro | 60s | 3008MB | 1TB |

### Optimasi untuk Vercel

1. **File Size Limit**: Maksimal 50MB per request
2. **Timeout**: 60 detik untuk Pro plan (10s untuk Free)
3. **Memory**: Optimal untuk gambar hingga 20-30MB
4. **Sharp Library**: Sudah dioptimasi untuk serverless

### Environment Variables (Optional)

Jika diperlukan, tambahkan di Vercel dashboard:
```
NODE_OPTIONS=--max-old-space-size=2048
```

### Monitoring

- Check function logs di Vercel dashboard
- Monitor function duration dan memory usage
- Track error rates untuk optimasi

## Penggunaan

1. Upload gambar di aplikasi
2. Pilih mode processing:
   - **Client**: Untuk testing dan gambar kecil
   - **Server**: Untuk produksi dan gambar besar
3. Konfigurasi pengaturan (Grid, Carousel, Custom)
4. Click "Cut Image"

## Troubleshooting

### Common Issues

1. **Timeout Error**
   - Kurangi ukuran gambar input
   - Upgrade ke Vercel Pro plan
   - Optimasi jumlah potong

2. **Memory Error**
   - Compress gambar sebelum upload
   - Gunakan client-side untuk gambar sangat besar
   - Check memory usage di Vercel logs

3. **API Route Not Found**
   - Pastikan file `app/api/crop/route.ts` ada
   - Check build logs untuk errors
   - Verify deployment status

### Debug Mode

Untuk debugging, check:
1. Network tab di browser DevTools
2. Vercel function logs
3. Console errors di browser

## Performance Tips

1. **Optimal Image Size**: 5-15MB untuk best performance
2. **Batch Processing**: Process satu gambar per request
3. **Caching**: Browser akan cache hasil processing
4. **Error Handling**: Fallback ke client-side jika server gagal

---

**Note**: Untuk testing lokal, pastikan Sharp library terinstall dengan benar. Di production Vercel, Sharp sudah tersedia secara otomatis.