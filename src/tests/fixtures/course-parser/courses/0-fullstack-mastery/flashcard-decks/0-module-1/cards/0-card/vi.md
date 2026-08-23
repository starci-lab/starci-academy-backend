# sortIndex
<!-- @starci/seperator -->
0
<!-- @starci/seperator -->
# isPremium
<!-- @starci/seperator -->
false
<!-- @starci/seperator -->
# question
<!-- @starci/seperator -->
Bạn cần một service phụ thuộc vào service khác. Vì sao nên giao việc tạo dependency đó cho một container thay vì tự tay tạo nó ở bất kỳ đâu bạn cần?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
junior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Dependency Injection
<!-- @starci/seperator -->
## 1
<!-- @starci/seperator -->
Architecture
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
Trả lời thẳng
:::
Tự tay tạo khiến bạn gắn cứng vào một implementation cụ thể, mỗi lần tạo lại sinh ra một bản riêng (mất chia sẻ), và khoá test của bạn vào đúng object thật đó. Giao việc tạo cho một {{c1::container::factory function,service locator}} đem lại khả năng test (thay bằng mock), loose coupling (đổi implementation mà không đụng consumer), và quản lý lifecycle tập trung.

:::muted
Cơ chế
:::
Một component khai báo nó cần gì qua tham số constructor; container đọc các khai báo đó, dựng dependency graph theo đúng thứ tự, tạo mỗi instance đúng một lần, rồi inject vào. Bạn không bao giờ tự khởi tạo dependency — bạn chỉ khai báo ý định.

:::muted
Bẫy thường gặp
:::
Một dependency tự tay tạo bên trong 1 class khiến class đó không thể unit-test được nếu không dựng luôn cái thật. Và nếu hai chỗ khác nhau đều tự tạo "cùng" một dependency, bạn âm thầm mất hẳn cam kết chia sẻ một instance duy nhất.

:::muted
Đào sâu tiếp
:::
nếu cùng một service bị tạo nhầm ở hai chỗ khác nhau, bug quan sát được là gì với một thứ vốn phải giữ state dùng chung?
<!-- @starci/seperator -->
