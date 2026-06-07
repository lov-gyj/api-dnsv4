// api/webhook.js
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const data = req.body;
    
    // 1. Ưu tiên lấy mã 'code' đã được SePay bóc tách sẵn
    // 2. Nếu không có, sẽ tự quét Regex trong trường 'description' (nội dung chuyển khoản từ ngân hàng)
    let orderId = null;
    
    if (data.code) {
      orderId = data.code.toUpperCase();
    } else if (data.description) {
      const match = data.description.match(/NEKO\d+/i);
      if (match) orderId = match[0].toUpperCase();
    }
    
    // Nếu tìm thấy mã đơn hàng hợp lệ dạng NEKOxxxxx
    if (orderId) {
      // Bắn tín hiệu realtime qua Pusher xuống trình duyệt của khách
      await pusher.trigger(orderId, 'payment-success', {
        status: 'success',
        message: 'Thanh toán thành công!',
        downloadUrl: 'https://api-dnsv4.vercel.app/files/nekodns-v4.mobileconfig' // Thay bằng link file thực tế của bạn
      });
      
      console.log(`[SePay] Kích hoạt thành công đơn hàng: ${orderId}`);
    }

    // BẮT BUỘC: Trả về đúng JSON {"success": true} để SePay biết bạn đã nhận dữ liệu thành công
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
