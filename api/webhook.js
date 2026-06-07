// api/webhook.js
import Pusher from 'pusher';

// Khởi tạo Pusher với biến môi trường của Vercel
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

export default async function handler(req, res) {
  // Chỉ nhận POST request từ Webhook
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Dữ liệu Sepay gửi sang
    const data = req.body;
    
    // Sepay có thể gửi data dạng mảng hoặc object tùy cấu hình, ta lấy nội dung chuyển khoản
    const transferContent = data.transferContent || data.description || '';
    
    // Tìm mã đơn hàng (VD: NEKO kèm theo số)
    const orderIdMatch = transferContent.match(/NEKO\d+/i);
    
    if (orderIdMatch) {
      const orderId = orderIdMatch[0].toUpperCase();

      // Kích hoạt sự kiện 'payment-success' qua Pusher
      await pusher.trigger(orderId, 'payment-success', {
        status: 'success',
        message: 'Thanh toán thành công!',
        // Bạn có thể logic hóa file tùy vào số tiền (amount) nếu cần
        downloadUrl: 'https://link-cua-ban.com/file-cau-hinh.mobileconfig' 
      });
    }

    // Trả về 200 OK để Sepay biết đã nhận Webhook thành công
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
