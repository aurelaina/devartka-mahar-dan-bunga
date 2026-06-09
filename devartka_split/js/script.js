// ==========================================
// KONFIGURASI INTEGRASI DATABASE SUPABASE CLOUD
// ==========================================
const SUPABASE_URL = "https://vwvxgsxxwdbzefzqffow.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3dnhnc3h4d2RiemVmenFmZm93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MjU1NTYsImV4cCI6MjA5NjQwMTU1Nn0.xjO-syE1Mmn-g0UuUUkZz2BVIdI-2xAjsWhXq5Zyq3s"; 

// Koneksi ke SDK Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 1. FITUR NAVBAR SCROLL TRANSITION
// ==========================================
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if(navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('bg-white', 'shadow-md');
            navbar.classList.remove('md:bg-transparent');
        } else {
            navbar.classList.remove('bg-white', 'shadow-md');
            if (window.location.pathname.includes('home.html') || (!window.location.pathname.includes('.html'))) {
                navbar.classList.add('md:bg-transparent');
            }
        }
    }
});

// ==========================================
// 2. FITUR NOTIFIKASI TOAST CUSTOM
// ==========================================
function showToast(message) {
    const toastLama = document.getElementById('devartka-custom-toast');
    if (toastLama) toastLama.remove();

    const toastContainer = document.createElement('div');
    toastContainer.id = 'devartka-custom-toast';
    toastContainer.style.position = 'fixed';
    toastContainer.style.bottom = '24px';
    toastContainer.style.right = '24px';
    toastContainer.style.backgroundColor = '#111827';
    toastContainer.style.color = '#ffffff';
    toastContainer.style.padding = '16px 24px';
    toastContainer.style.borderRadius = '16px';
    toastContainer.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.3)';
    toastContainer.style.zIndex = '999999';
    toastContainer.style.transition = 'all 0.4s ease';
    toastContainer.style.opacity = '0';
    toastContainer.style.transform = 'translateY(20px)';

    toastContainer.innerHTML = message;
    document.body.appendChild(toastContainer);

    setTimeout(() => {
        toastContainer.style.opacity = '1';
        toastContainer.style.transform = 'translateY(0)';
    }, 50);

    setTimeout(() => {
        toastContainer.style.opacity = '0';
        toastContainer.style.transform = 'translateY(20px)';
        setTimeout(() => toastContainer.remove(), 400);
    }, 4500);
}

// ==========================================
// 3. STATE VARIABEL & PROSES ALUR MODAL PEMBAYARAN
// ==========================================
let produkDipilih = null;
let hargaDipilih = 0;
let metodeDipilih = "";

// Langkah 1: Membuka Menu Pilihan Metode Payment
function bukaModalPayment(productName, productPrice) {
    produkDipilih = productName;
    hargaDipilih = productPrice;
    
    const modalName = document.getElementById('modalProductName');
    const modal = document.getElementById('paymentModal');
    
    if(modalName && modal) {
        modalName.innerText = `"${productName}"`;
        modal.classList.remove('hidden');
    }
}

// Menutup Menu Pilihan Metode Payment
function tutupModalPayment() {
    const modal = document.getElementById('paymentModal');
    if(modal) modal.classList.add('hidden');
}

// Langkah 2: Mengarahkan ke Menu Konfirmasi Tagihan
function pilihPayment(paymentMode) {
    metodeDipilih = paymentMode;
    tutupModalPayment();

    const actionModal = document.getElementById('actionPaymentModal');
    const textPayment = document.getElementById('selectedPaymentText');
    const textTagihan = document.getElementById('totalTagihanText');

    if (actionModal && textPayment && textTagihan) {
        textPayment.innerText = paymentMode;
        textTagihan.innerText = `Rp ${hargaDipilih.toLocaleString('id-ID')}`;
        actionModal.classList.remove('hidden');
    }
}

// Membatalkan aksi pilihan metode payment
function batalAksiPayment() {
    const actionModal = document.getElementById('actionPaymentModal');
    if(actionModal) actionModal.classList.add('hidden');
    
    const modal = document.getElementById('paymentModal');
    if(modal) modal.classList.remove('hidden');
}

// Langkah 3: Eksekusi Sukses Pembayaran & Mengirimkan Data ke Cloud Supabase
async function eksekusiBayarSukses() {
    if (!produkDipilih || !metodeDipilih) return;

    const orderId = 'ORD-' + Date.now();
    const waktuSekarang = new Date().toLocaleString('id-ID');

    // PEMBENARAN SINKRONISASI: Kita hilangkan kolom 'harga' sepenuhnya agar tidak memicu error bigint.
    // Menyesuaikan dengan kolom yang Anda miliki: nama_produk, metode_pembayaran, status.
    const dataKirimSupabase = {
        nama_produk: produkDipilih,
        metode_pembayaran: metodeDipilih, 
        status: 'Paid (Lunas)'
    };

    // --- PROSES A: KIRIM DATA KE CLOUD DATABASE INTERNET SUPABASE ---
    try {
        const { data, error } = await supabaseClient
            .from('pesanan')
            .insert([dataKirimSupabase]);

        if (error) throw error;
        console.log("Data berhasil dikirim ke Cloud Supabase!", data);

    } catch (err) {
        console.error("Gagal mengirim ke Supabase Cloud:", err.message);
    }

    // --- PROSES B: CADANGAN KE LOCAL STORAGE ---
    let databasePesanan = JSON.parse(localStorage.getItem('devartka_orders')) || [];
    const pesananBaru = {
        id: orderId,
        produk: produkDipilih,
        harga: hargaDipilih,
        tanggal: waktuSekarang,
        payment: metodeDipilih,
        status: 'Paid (Lunas)'
    };
    databasePesanan.push(pesananBaru);
    localStorage.setItem('devartka_orders', JSON.stringify(databasePesanan));

    // Sembunyikan Modal Langkah 2 Konfirmasi Tagihan
    const actionModal = document.getElementById('actionPaymentModal');
    if(actionModal) actionModal.classList.add('hidden');

    // --- PROSES C: PICU POP-UP NOTIFIKASI SUKSES ---
    const HTMLNotif = `
        <div style="display: flex; align-items: flex-start; gap: 12px; font-family: sans-serif;">
            <div style="width: 32px; height: 32px; background-color: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0;">
                <i class="fa-solid fa-check" style="font-size: 14px;"></i>
            </div>
            <div>
                <p style="font-weight: bold; font-size: 14px; margin: 0; color: #34D399;">Pembayaran Berhasil!</p>
                <p style="font-size: 12px; margin: 4px 0 0 0; color: #E5E7EB;">Sukses memproses produk <span style="color: #F472B6; font-weight: 600;">${pesananBaru.produk}</span></p>
            </div>
        </div>
    `;
    showToast(HTMLNotif);

    // --- PROSES D: DATA INVOICE STRUK DIGITAL ---
    document.getElementById('receiptId').innerText = pesananBaru.id;
    document.getElementById('receiptDate').innerText = pesananBaru.tanggal;
    document.getElementById('receiptProduct').innerText = pesananBaru.produk;
    document.getElementById('receiptMethod').innerText = pesananBaru.payment;
    document.getElementById('receiptTotal').innerText = `Rp ${pesananBaru.harga.toLocaleString('id-ID')}`;

    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal) {
        receiptModal.classList.remove('hidden');
    }
}

// PEMBENARAN: Menambahkan kembali fungsi penutup struk belanja yang hilang
function tutupReceiptModal() {
    const receiptModal = document.getElementById('receiptModal');
    if (receiptModal) {
        receiptModal.classList.add('hidden');
    }
    // Bersihkan State Variabel kembali ke default
    produkDipilih = null;
    hargaDipilih = 0;
    metodeDipilih = "";
}