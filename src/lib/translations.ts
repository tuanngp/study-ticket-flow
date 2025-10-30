// Vietnamese translations for EduTicket AI
export const translations = {
  // Navigation
  nav: {
    home: "Trang chủ",
    dashboard: "Bảng điều khiển",
    createTicket: "Tạo ticket",
    myTickets: "Ticket của tôi",
    allTickets: "Tất cả ticket",
    groups: "Nhóm",
    profile: "Hồ sơ",
    notifications: "Thông báo",
    knowledgeBase: "Kiến thức cơ bản",
    analytics: "Phân tích",
    calendar: "Lịch",
    admin: "Quản trị",
    signIn: "Đăng nhập",
    signOut: "Đăng xuất",
    signUp: "Đăng ký",
    backToDashboard: "Quay lại bảng điều khiển",
    back: "Quay lại",
  },

  // Authentication
  auth: {
    welcome: "Chào mừng đến EduTicket AI",
    signInMessage: "Đăng nhập vào tài khoản hoặc tạo tài khoản mới",
    email: "Địa chỉ Email",
    password: "Mật khẩu",
    fullName: "Họ và tên",
    role: "Vai trò",
    selectRole: "Chọn vai trò của bạn",
    signIn: "Đăng nhập",
    signUp: "Đăng ký",
    createAccount: "Tạo tài khoản",
    signingIn: "Đang đăng nhập...",
    creatingAccount: "Đang tạo tài khoản...",
    accountCreated: "Tài khoản đã được tạo thành công!",
    signedIn: "Đăng nhập thành công!",
    signedOut: "Đăng xuất thành công",
    signOutFailed: "Không thể đăng xuất",
    termsOfService: "Điều khoản dịch vụ",
    privacyPolicy: "Chính sách bảo mật",
    bySigningUp: "Bằng cách đăng ký, bạn đồng ý với",
    and: "và",
    home: "Về trang chủ",
    placeholder: {
      email: "sinhvien@fpt.edu.vn",
      name: "Nguyễn Văn A",
    },
  },

  // User Roles
  roles: {
    student: {
      title: "Sinh viên",
      description: "Tạo ticket, theo dõi tiến độ và nhận hỗ trợ từ giảng viên",
      features: [
        "Gửi yêu cầu hỗ trợ",
        "Theo dõi trạng thái ticket",
        "Truy cập tài liệu học tập"
      ]
    },
    instructor: {
      title: "Giảng viên",
      description: "Quản lý ticket, cung cấp hướng dẫn và theo dõi tiến độ sinh viên",
      features: [
        "Xem và phân công ticket",
        "Cung cấp hướng dẫn chuyên môn",
        "Xem bảng điều khiển phân tích"
      ]
    },
    admin: {
      title: "Quản trị viên",
      description: "Quyền truy cập đầy đủ hệ thống với quản lý người dùng và cấu hình hệ thống",
      features: [
        "Quản lý người dùng và vai trò",
        "Cấu hình hệ thống",
        "Phân tích nâng cao"
      ]
    }
  },

  // Dashboard
  dashboard: {
    title: "Bảng điều khiển",
    welcome: "Chào mừng",
    overview: "Tổng quan",
    myTickets: "Ticket của tôi",
    recentActivity: "Hoạt động gần đây",
    quickActions: "Hành động nhanh",
    statistics: "Thống kê",
    activeTickets: "Ticket đang hoạt động",
    resolvedTickets: "Ticket đã giải quyết",
    averageResponseTime: "Thời gian phản hồi trung bình",
    resolutionRate: "Tỷ lệ giải quyết",
    loading: "Đang tải...",
    error: "Lỗi",
    noData: "Không có dữ liệu",
    viewAll: "Xem tất cả",
    createNew: "Tạo mới",
    search: "Tìm kiếm",
    filter: "Lọc",
    sort: "Sắp xếp",
  },

  // Tickets
  tickets: {
    create: "Tạo ticket",
    edit: "Chỉnh sửa ticket",
    delete: "Xóa ticket",
    view: "Xem ticket",
    assign: "Phân công",
    resolve: "Giải quyết",
    close: "Đóng",
    reopen: "Mở lại",
    comment: "Bình luận",
    attachment: "Đính kèm",
    priority: "Ưu tiên",
    status: "Trạng thái",
    type: "Loại",
    title: "Tiêu đề",
    description: "Mô tả",
    created: "Đã tạo",
    updated: "Đã cập nhật",
    dueDate: "Hạn chót",
    assignee: "Người được phân công",
    creator: "Người tạo",
    loadingTickets: "Đang tải ticket...",
    noTickets: "Không có ticket nào",
    ticketCreated: "Ticket đã được tạo thành công!",
    ticketUpdated: "Ticket đã được cập nhật thành công!",
    ticketDeleted: "Ticket đã được xóa thành công!",
    createFailed: "Không thể tạo ticket",
    updateFailed: "Không thể cập nhật ticket",
    deleteFailed: "Không thể xóa ticket",
    loadFailed: "Không thể tải ticket",
    confirmDelete: "Bạn có chắc chắn muốn xóa ticket này?",
    selectPriority: "Chọn mức ưu tiên",
    selectStatus: "Chọn trạng thái",
    selectType: "Chọn loại ticket",
    enterTitle: "Nhập tiêu đề",
    enterDescription: "Nhập mô tả",
    searchTickets: "Tìm kiếm ticket...",
    filterByStatus: "Lọc theo trạng thái",
    filterByPriority: "Lọc theo ưu tiên",
    filterByType: "Lọc theo loại",
    sortByDate: "Sắp xếp theo ngày",
    sortByPriority: "Sắp xếp theo ưu tiên",
  },

  // Ticket Types and Priorities
  ticketTypes: {
    bug: "Lỗi",
    feature: "Tính năng",
    question: "Câu hỏi",
    task: "Nhiệm vụ",
    coding_error: "Lỗi lập trình",
    concept_question: "Câu hỏi khái niệm",
    setup_help: "Trợ giúp thiết lập",
    grading_issue: "Vấn đề chấm điểm",
    other: "Khác",
  },

  ticketPriorities: {
    low: "Thấp",
    medium: "Trung bình",
    high: "Cao",
    critical: "Khẩn cấp",
  },

  ticketStatuses: {
    open: "Mở",
    in_progress: "Đang xử lý",
    resolved: "Đã giải quyết",
    closed: "Đã đóng",
  },

  // Educational Context
  educational: {
    course: "Khóa học",
    class: "Lớp",
    semester: "Học kỳ",
    academicLevel: "Mức độ học thuật",
    projectGroup: "Nhóm dự án",
    selectCourse: "Chọn khóa học",
    selectClass: "Chọn lớp",
    selectGroup: "Chọn nhóm",
    difficultyLevel: "Mức độ khó",
    foundation: "Cơ bản (mới bắt đầu)",
    intermediate: "Trung cấp (có kinh nghiệm)",
    advanced: "Nâng cao (chuyên sâu)",
    assessUnderstanding: "Đánh giá mức độ hiểu biết của bạn",
    relatedTopics: "Chủ đề liên quan",
    assignmentDeadline: "Hạn nộp bài",
    submissionStatus: "Trạng thái nộp bài",
  },

  // AI Features
  ai: {
    suggestions: "Gợi ý AI",
    analyzing: "Đang phân tích...",
    analysisComplete: "Phân tích hoàn thành",
    smartClassification: "Phân loại thông minh",
    autoAssignment: "Phân công tự động",
    confidence: "Độ tin cậy",
    reasoning: "Lý do",
    acceptSuggestion: "Chấp nhận gợi ý",
    rejectSuggestion: "Từ chối gợi ý",
    aiAssisted: "Hỗ trợ bởi AI",
    learningInsights: "Thông tin học tập",
  },

  // Forms
  forms: {
    required: "Bắt buộc",
    optional: "Tùy chọn",
    save: "Lưu",
    cancel: "Hủy",
    submit: "Gửi",
    reset: "Đặt lại",
    clear: "Xóa",
    confirm: "Xác nhận",
    yes: "Có",
    no: "Không",
    ok: "OK",
    close: "Đóng",
    next: "Tiếp theo",
    previous: "Trước đó",
    finish: "Hoàn thành",
    continue: "Tiếp tục",
    skip: "Bỏ qua",
    retry: "Thử lại",
    refresh: "Làm mới",
  },

  // Validation Messages
  validation: {
    required: "Trường này là bắt buộc",
    minLength: "Phải có ít nhất {min} ký tự",
    maxLength: "Không được vượt quá {max} ký tự",
    invalidEmail: "Email không hợp lệ",
    invalidPassword: "Mật khẩu không hợp lệ",
    passwordMismatch: "Mật khẩu không khớp",
    invalidDate: "Ngày không hợp lệ",
    invalidNumber: "Số không hợp lệ",
    fileTooLarge: "File quá lớn",
    invalidFileType: "Loại file không hợp lệ",
    titleRequired: "Tiêu đề là bắt buộc",
    descriptionRequired: "Mô tả là bắt buộc",
    courseRequired: "Khóa học là bắt buộc",
    classRequired: "Lớp là bắt buộc",
    minPasswordLength: "Mật khẩu tối thiểu 6 ký tự",
  },

  // Notifications
  notifications: {
    title: "Thông báo",
    markAsRead: "Đánh dấu đã đọc",
    markAllAsRead: "Đánh dấu tất cả đã đọc",
    noNotifications: "Không có thông báo nào",
    newNotification: "Thông báo mới",
    unread: "chưa đọc",
    all: "Tất cả",
    today: "Hôm nay",
    yesterday: "Hôm qua",
    thisWeek: "Tuần này",
    older: "Cũ hơn",
  },

  // Analytics
  analytics: {
    title: "Phân tích",
    overview: "Tổng quan",
    trends: "Xu hướng",
    performance: "Hiệu suất",
    insights: "Thông tin chi tiết",
    reports: "Báo cáo",
    metrics: "Chỉ số",
    charts: "Biểu đồ",
    data: "Dữ liệu",
    export: "Xuất dữ liệu",
    timeRange: "Khoảng thời gian",
    last7Days: "7 ngày qua",
    last30Days: "30 ngày qua",
    last3Months: "3 tháng qua",
    last6Months: "6 tháng qua",
    lastYear: "Năm qua",
    custom: "Tùy chỉnh",
  },

  // Calendar
  calendar: {
    title: "Lịch",
    today: "Hôm nay",
    month: "Tháng",
    week: "Tuần",
    day: "Ngày",
    agenda: "Lịch trình",
    event: "Sự kiện",
    deadline: "Hạn chót",
    reminder: "Nhắc nhở",
    addEvent: "Thêm sự kiện",
    editEvent: "Chỉnh sửa sự kiện",
    deleteEvent: "Xóa sự kiện",
    eventTitle: "Tiêu đề sự kiện",
    eventDescription: "Mô tả sự kiện",
    startDate: "Ngày bắt đầu",
    endDate: "Ngày kết thúc",
    startTime: "Thời gian bắt đầu",
    endTime: "Thời gian kết thúc",
    allDay: "Cả ngày",
  },

  // Groups
  groups: {
    title: "Nhóm",
    myGroups: "Nhóm của tôi",
    createGroup: "Tạo nhóm",
    joinGroup: "Tham gia nhóm",
    leaveGroup: "Rời nhóm",
    groupName: "Tên nhóm",
    groupDescription: "Mô tả nhóm",
    members: "Thành viên",
    leader: "Trưởng nhóm",
    projects: "Dự án",
    discussions: "Thảo luận",
    files: "File",
    settings: "Cài đặt",
  },


  // Profile
  profile: {
    title: "Hồ sơ",
    personalInfo: "Thông tin cá nhân",
    accountSettings: "Cài đặt tài khoản",
    preferences: "Tùy chọn",
    security: "Bảo mật",
    notifications: "Thông báo",
    privacy: "Riêng tư",
    avatar: "Ảnh đại diện",
    changePassword: "Đổi mật khẩu",
    currentPassword: "Mật khẩu hiện tại",
    newPassword: "Mật khẩu mới",
    confirmPassword: "Xác nhận mật khẩu",
    updateProfile: "Cập nhật hồ sơ",
    profileUpdated: "Hồ sơ đã được cập nhật",
    passwordChanged: "Mật khẩu đã được thay đổi",
  },

  // Admin
  admin: {
    title: "Quản trị",
    users: "Người dùng",
    roles: "Vai trò",
    permissions: "Quyền hạn",
    settings: "Cài đặt",
    system: "Hệ thống",
    maintenance: "Bảo trì",
    logs: "Nhật ký",
    backup: "Sao lưu",
    restore: "Khôi phục",
    statistics: "Thống kê",
    reports: "Báo cáo",
  },

  // Error Messages
  errors: {
    generic: "Đã xảy ra lỗi",
    network: "Lỗi mạng",
    server: "Lỗi máy chủ",
    unauthorized: "Không có quyền truy cập",
    forbidden: "Bị cấm",
    notFound: "Không tìm thấy",
    badRequest: "Yêu cầu không hợp lệ",
    validation: "Lỗi xác thực",
    timeout: "Hết thời gian chờ",
    offline: "Không có kết nối internet",
    tryAgain: "Vui lòng thử lại",
    contactSupport: "Liên hệ hỗ trợ",
    pageNotFound: "Trang không tìm thấy",
    goHome: "Về trang chủ",
  },

  // Success Messages
  success: {
    saved: "Đã lưu thành công",
    updated: "Đã cập nhật thành công",
    deleted: "Đã xóa thành công",
    created: "Đã tạo thành công",
    sent: "Đã gửi thành công",
    received: "Đã nhận thành công",
    completed: "Đã hoàn thành",
    approved: "Đã phê duyệt",
    rejected: "Đã từ chối",
  },

  // Loading States
  loading: {
    loading: "Đang tải...",
    saving: "Đang lưu...",
    updating: "Đang cập nhật...",
    deleting: "Đang xóa...",
    creating: "Đang tạo...",
    sending: "Đang gửi...",
    processing: "Đang xử lý...",
    analyzing: "Đang phân tích...",
    pleaseWait: "Vui lòng đợi...",
  },

  // Features
  features: {
    smartClassification: "Phân loại thông minh",
    smartClassificationDesc: "AI tự động phân loại và ưu tiên ticket",
    educationalFocus: "Tập trung giáo dục",
    educationalFocusDesc: "Được thiết kế đặc biệt cho môi trường học thuật",
    groupCollaboration: "Hợp tác nhóm",
    groupCollaborationDesc: "Giao tiếp liền mạch giữa sinh viên và giảng viên",
    security: "Bảo mật & Tin cậy",
    securityDesc: "Bảo mật cấp doanh nghiệp cho trường đại học",
  },

  // Stats
  stats: {
    rating: "Đánh giá",
    users: "Người dùng",
    uptime: "Hoạt động",
  },

  // Time
  time: {
    now: "Bây giờ",
    justNow: "Vừa xong",
    minutesAgo: "phút trước",
    hoursAgo: "giờ trước",
    daysAgo: "ngày trước",
    weeksAgo: "tuần trước",
    monthsAgo: "tháng trước",
    yearsAgo: "năm trước",
    today: "Hôm nay",
    yesterday: "Hôm qua",
    tomorrow: "Ngày mai",
    thisWeek: "Tuần này",
    lastWeek: "Tuần trước",
    thisMonth: "Tháng này",
    lastMonth: "Tháng trước",
    thisYear: "Năm nay",
    lastYear: "Năm ngoái",
  },

  // Common Actions
  actions: {
    add: "Thêm",
    edit: "Chỉnh sửa",
    delete: "Xóa",
    view: "Xem",
    create: "Tạo",
    update: "Cập nhật",
    save: "Lưu",
    cancel: "Hủy",
    submit: "Gửi",
    search: "Tìm kiếm",
    filter: "Lọc",
    sort: "Sắp xếp",
    export: "Xuất",
    import: "Nhập",
    upload: "Tải lên",
    download: "Tải xuống",
    share: "Chia sẻ",
    copy: "Sao chép",
    paste: "Dán",
    cut: "Cắt",
    undo: "Hoàn tác",
    redo: "Làm lại",
    refresh: "Làm mới",
    reload: "Tải lại",
    reset: "Đặt lại",
    clear: "Xóa",
    select: "Chọn",
    selectAll: "Chọn tất cả",
    deselect: "Bỏ chọn",
    deselectAll: "Bỏ chọn tất cả",
    expand: "Mở rộng",
    collapse: "Thu gọn",
    show: "Hiển thị",
    hide: "Ẩn",
    open: "Mở",
    close: "Đóng",
    enable: "Bật",
    disable: "Tắt",
    activate: "Kích hoạt",
    deactivate: "Vô hiệu hóa",
    start: "Bắt đầu",
    stop: "Dừng",
    pause: "Tạm dừng",
    resume: "Tiếp tục",
    finish: "Hoàn thành",
    complete: "Hoàn tất",
    approve: "Phê duyệt",
    reject: "Từ chối",
    accept: "Chấp nhận",
    decline: "Từ chối",
    confirm: "Xác nhận",
    deny: "Phủ nhận",
    allow: "Cho phép",
    block: "Chặn",
    grant: "Cấp",
    revoke: "Thu hồi",
    assign: "Phân công",
    unassign: "Hủy phân công",
    delegate: "Ủy quyền",
    escalate: "Leo thang",
    resolve: "Giải quyết",
    reopen: "Mở lại",
    archive: "Lưu trữ",
    unarchive: "Bỏ lưu trữ",
  },

  // Knowledge Base Section
  knowledgeBaseSection: {
    searchQuestionsAndAnswers: "Tìm kiếm câu hỏi và câu trả lời...",
    editEntry: "Chỉnh sửa mục",
    deleteEntry: "Xóa mục",
    viewVersionHistory: "Xem lịch sử phiên bản",
    addTag: "Thêm thẻ...",
    saveToKnowledgeBase: "Lưu vào Cơ sở Kiến thức",
  },

  // Loading States
  deleting: "Đang xóa...",
};

// Helper function to get nested translation
export const t = (key: string): string => {
  const keys = key.split('.');
  let value: any = translations;

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation key not found: ${key}`);
      return key; // Fallback to the key itself
    }
  }

  return typeof value === 'string' ? value : key;
};

// Helper function to get translation with parameters
export const tParam = (key: string, params: Record<string, string | number>): string => {
  let text = t(key);

  for (const [param, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`{${param}}`, 'g'), String(value));
  }

  return text;
};
