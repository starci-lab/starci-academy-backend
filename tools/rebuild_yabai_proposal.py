from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak

OUT = Path('output/pdf/YABAI_NAIL_Proposal_TEDO_redesign.pdf')
OUT.parent.mkdir(parents=True, exist_ok=True)
pdfmetrics.registerFont(TTFont('Arial','C:/Windows/Fonts/arial.ttf'))
pdfmetrics.registerFont(TTFont('Arial-Bold','C:/Windows/Fonts/arialbd.ttf'))
INK=HexColor('#262321'); MUTED=HexColor('#756E68'); ROSE=HexColor('#8E4D5B'); BLUSH=HexColor('#EAD9D5'); SAND=HexColor('#E9E0D5')
ss=getSampleStyleSheet()
ss.add(ParagraphStyle(name='K',fontName='Arial-Bold',fontSize=8.5,leading=11,textColor=ROSE,spaceAfter=5))
ss.add(ParagraphStyle(name='T',fontName='Arial-Bold',fontSize=27,leading=31,textColor=INK,spaceAfter=8))
ss.add(ParagraphStyle(name='S',fontName='Arial',fontSize=11,leading=16,textColor=MUTED,spaceAfter=10))
ss.add(ParagraphStyle(name='H',fontName='Arial-Bold',fontSize=18,leading=22,textColor=INK,spaceAfter=8))
ss.add(ParagraphStyle(name='H2',fontName='Arial-Bold',fontSize=11,leading=14,textColor=INK,spaceAfter=4))
ss.add(ParagraphStyle(name='B',fontName='Arial',fontSize=9.2,leading=13,textColor=INK,spaceAfter=4))
ss.add(ParagraphStyle(name='SM',fontName='Arial',fontSize=7.8,leading=10.2,textColor=MUTED))
ss.add(ParagraphStyle(name='SB',fontName='Arial-Bold',fontSize=8.2,leading=10.5,textColor=INK))
ss.add(ParagraphStyle(name='M',fontName='Arial-Bold',fontSize=18,leading=20,textColor=ROSE,alignment=1))
ss.add(ParagraphStyle(name='ML',fontName='Arial',fontSize=8,leading=10,textColor=MUTED,alignment=1))
ss.add(ParagraphStyle(name='PR',fontName='Arial-Bold',fontSize=18,leading=20,textColor=ROSE,alignment=2))
def p(x,s='B'): return Paragraph(x,ss[s])
def dots(xs): return '<br/>'.join('<font color="#8E4D5B">●</font> '+x for x in xs)
def card(title, xs):
    t=Table([[p(title,'H2')],[p(dots(xs))]],colWidths=[83*mm])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.white),('BOX',(0,0),(-1,-1),.5,SAND),('LEFTPADDING',(0,0),(-1,-1),10),('RIGHTPADDING',(0,0),(-1,-1),10),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
    return t
def footer(c,doc):
    w,_=A4; c.saveState(); c.setFillColor(ROSE); c.rect(0,0,w,4*mm,fill=1,stroke=0); c.setFont('Arial',7.5); c.setFillColor(MUTED); c.drawString(18*mm,9*mm,'TEDO  |  Đề xuất phát triển YABAI NAIL'); c.drawRightString(w-18*mm,9*mm,f'{doc.page:02d}'); c.restoreState()
doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=16*mm,bottomMargin=18*mm,title='Đề xuất phát triển YABAI NAIL')
st=[]

# Cover
st += [Spacer(1,12*mm),p('TEDO  /  ĐỀ XUẤT PHÁT TRIỂN','K'),p('YABAI NAIL','T'),p('Một hệ thống đặt lịch gọn, đẹp và dễ vận hành - để khách đặt nhanh hơn, salon quản lý nhẹ hơn.','S'),Spacer(1,8*mm)]
hero=Table([[p('YABAI NAIL','H'),p('APP + SALON ADMIN','SB')],[p('Hệ thống hoàn chỉnh trên iPhone, Android và quản trị salon','B'),p('Việt / Nhật<br/>1 salon - sẵn sàng mở rộng','SM')]],colWidths=[112*mm,54*mm])
hero.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),BLUSH),('BOX',(0,0),(-1,-1),.5,BLUSH),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),12),('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),11),('BOTTOMPADDING',(0,0),(-1,-1),11)]))
st += [hero,Spacer(1,12*mm)]
met=Table([[p('2-3 tuần','M'),p('25.000.000đ','M'),p('iOS + Android','M')],[p('Thời gian dự kiến','ML'),p('Trọn gói chưa VAT','ML'),p('App native hoàn chỉnh','ML')]],colWidths=[55*mm]*3)
met.setStyle(TableStyle([('BOX',(0,0),(-1,-1),.5,SAND),('INNERGRID',(0,0),(-1,-1),.5,SAND),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
st += [met,Spacer(1,16*mm),p('MỤC TIÊU','K'),p('Một hệ thống duy nhất cho đặt lịch, vận hành, chăm sóc khách và tăng tỷ lệ quay lại.','H'),p('Ngày 06/08/2026  |  Hiệu lực 30 ngày  |  Đơn vị thực hiện: TEDO','SM'),PageBreak()]

# Value
st += [p('01  /  GIẢI PHÁP','K'),p('Một trải nghiệm liền mạch từ khách đến salon','H'),p('Bản triển khai bao gồm đầy đủ các nhóm chức năng đã thống nhất, không tách các hạng mục chính sang giai đoạn sau.','S')]
rows=[[card('Khách đặt lịch',['Chọn dịch vụ, nhân viên, ngày và giờ','Gửi ảnh mẫu, xem bộ sưu tập','Đặt cọc, nhận nhắc lịch, đổi/hủy']),card('Salon vận hành',['Lịch đa nhân viên, chống trùng','Phân bổ nâng cao theo kỹ năng và thời lượng','Quản lý dịch vụ, ca làm, hoa hồng'])],[card('Khách quay lại',['Tích điểm và hạng thành viên','QR membership, coupon sinh nhật','Review có ảnh và thưởng điểm']),card('Quản trị tăng trưởng',['Báo cáo doanh thu và khách mới/cũ','Ảnh trước/sau, nội dung SNS','Đa chi nhánh, phân quyền quản trị'])]]
tb=Table(rows,colWidths=[87*mm,87*mm]); tb.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
st += [tb,Spacer(1,6*mm),p('GIÁ TRỊ KINH DOANH','K'),p('Giảm đặt lịch thủ công, hạn chế no-show, gom dữ liệu khách hàng về một nơi và tạo lý do rõ ràng để khách quay lại sau 30/60 ngày.','B'),PageBreak()]

# Scope
st += [p('02  /  PHẠM VI ĐẦY ĐỦ','K'),p('Không cắt các phần tạo nên trải nghiệm premium','H')]
scope=[[p('APP KHÁCH HÀNG','H2'),p('SALON ADMIN & BACK OFFICE','H2')],[p(dots(['App native iPhone + Android','Đăng nhập SĐT/OTP và mạng xã hội','Đặt lịch, đặt cọc, đổi/hủy, nhắc lịch','Menu, ảnh mẫu, review có thưởng','Tích điểm, hạng, QR membership','Coupon, ưu đãi, thông báo đẩy','Việt / Nhật đầy đủ nội dung'])),p(dots(['Lịch nhiều nhân viên và nhiều chi nhánh','Phân bổ theo kỹ năng, thời lượng, ca làm','Khách hàng, lịch sử, dị ứng, ảnh trước/sau','Dịch vụ, phụ phí, bảng giá','Nhân viên, hoa hồng, phân quyền','Thanh toán, hoàn tiền, đối soát','Báo cáo doanh thu và khách quay lại']))]]
sc=Table(scope,colWidths=[87*mm,87*mm]); sc.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUSH),('BOX',(0,0),(-1,-1),.5,SAND),('INNERGRID',(0,0),(-1,-1),.5,SAND),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),11),('RIGHTPADDING',(0,0),(-1,-1),11),('TOPPADDING',(0,0),(-1,-1),10),('BOTTOMPADDING',(0,0),(-1,-1),10)]))
st += [sc,Spacer(1,9*mm),p('LƯU Ý PHẠM VI','K'),p('Đây là gói triển khai một lần cho hệ thống hoàn chỉnh. Mọi thay đổi sau khi chốt UX/UI sẽ được xử lý theo change request và chỉ phát sinh khi hai bên đồng ý bằng văn bản.','B'),PageBreak()]

# Timeline
st += [p('03  /  TIẾN ĐỘ & NGHIỆM THU','K'),p('Làm nhanh, chốt rõ từng điểm kiểm soát','H')]
timeline=[[p('01-02','M'),p('03-09','M'),p('10-13','M'),p('14-16','M')],[p('UX/UI','H2'),p('App khách','H2'),p('Admin','H2'),p('Test & store','H2')],[p('Wireframe, UI kit, duyệt luồng đầy đủ.','SM'),p('Booking, member, review, thông báo, song ngữ.','SM'),p('Lịch nâng cao, đa chi nhánh, thanh toán, báo cáo.','SM'),p('Tích hợp, kiểm thử, bàn giao và hướng dẫn.','SM')]]
tl=Table(timeline,colWidths=[43.5*mm]*4); tl.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUSH),('BOX',(0,0),(-1,-1),.5,SAND),('INNERGRID',(0,0),(-1,-1),.5,SAND),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
st += [tl,Spacer(1,10*mm),p('ĐIỀU KIỆN ĐỂ GIỮ TIẾN ĐỘ','K'),p(dots(['YABAI cung cấp logo, ảnh, menu giá, chính sách đặt cọc, nội dung Việt/Nhật và thông tin store khi khởi động.','Duyệt UX/UI trong 2 ngày; nội dung và luồng đã duyệt là cơ sở để lập trình.','Thời gian duyệt App Store/CH Play phụ thuộc nền tảng; TEDO chịu trách nhiệm chuẩn bị và xử lý hồ sơ.'])),PageBreak()]

# Price and terms
st += [p('04  /  BÁO GIÁ','K'),p('Một gói hoàn chỉnh - một mức đầu tư','H'),p('Bao gồm thiết kế, lập trình app native, back office, kiểm thử, deploy và bàn giao. Chưa gồm VAT.','S')]
price=[[p('HẠNG MỤC','SB'),p('PHẠM VI','SB'),p('THÀNH TIỀN','SB')],[p('A / UX/UI','H2'),p('Nghiên cứu, wireframe, UI kit, app khách, admin, luồng Việt/Nhật.','B'),p('3.000.000','PR')],[p('B / APP NATIVE','H2'),p('iPhone + Android; booking, đặt cọc, nhắc lịch, member, QR, review, coupon, song ngữ.','B'),p('14.200.000','PR')],[p('C / ADMIN ĐẦY ĐỦ','H2'),p('Lịch nâng cao, đa chi nhánh, nhân viên, hoa hồng, thanh toán, báo cáo, phân quyền.','B'),p('7.000.000','PR')],[p('D / DEPLOY & BÀN GIAO','H2'),p('Store, kiểm thử, tài liệu, đào tạo và bàn giao.','B'),p('800.000','PR')],[p('TỔNG ĐẦU TƯ','H2'),p('Trọn gói hệ thống hoàn chỉnh - chưa VAT.','B'),p('25.000.000đ','PR')]]
pt=Table(price,colWidths=[48*mm,86*mm,39*mm]); pt.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),BLUSH),('BACKGROUND',(0,5),(-1,5),SAND),('BOX',(0,0),(-1,-1),.5,SAND),('INNERGRID',(0,0),(-1,-1),.5,SAND),('VALIGN',(0,0),(-1,-1),'TOP'),('ALIGN',(2,1),(2,-1),'RIGHT'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),9)]))
st += [pt,Spacer(1,8*mm),p('THANH TOÁN','K')]
pay=Table([[p('40%','M'),p('30%','M'),p('30%','M')],[p('Ký hợp đồng<br/>Bắt đầu UX/UI','ML'),p('Duyệt UI<br/>Bắt đầu code','ML'),p('Nghiệm thu<br/>Bàn giao','ML')],[p('10.000.000đ','H2'),p('7.500.000đ','H2'),p('7.500.000đ','H2')]],colWidths=[58*mm]*3); pay.setStyle(TableStyle([('BOX',(0,0),(-1,-1),.5,SAND),('INNERGRID',(0,0),(-1,-1),.5,SAND),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
st += [pay,Spacer(1,8*mm),p('VẬN HÀNH','K'),p('Cloud server khoảng 500.000đ/tháng; tên miền từ năm thứ 2 khoảng 300.000đ/năm; Apple Developer khoảng 2.500.000đ/năm.','B'),p('Cam kết trọn gói đúng phạm vi đã thống nhất, không phát sinh nếu chưa có xác nhận bằng văn bản.','B'),Spacer(1,8*mm),p('BƯỚC TIẾP THEO','K'),p('Chốt brief, nhận tài nguyên thương hiệu và bắt đầu UX/UI trong 2 ngày sau khi duyệt đề xuất.','B'),Spacer(1,8*mm),p('TEDO','T'),p('Teach  /  Empower  /  Do  /  Optimize','SM')]
doc.build(st,onFirstPage=footer,onLaterPages=footer)
print(OUT)
