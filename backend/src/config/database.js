const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(process.env.DB_PATH || './data/clb.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ─────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'student',
    major       TEXT,
    year        INTEGER DEFAULT 1,
    avatar      TEXT    DEFAULT '/default-avatar.png',
    bio         TEXT,
    created_at  TEXT    DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS clubs (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    slug         TEXT NOT NULL UNIQUE,
    category     TEXT NOT NULL,
    short_desc   TEXT,
    description  TEXT,
    logo         TEXT DEFAULT '/default-club.png',
    banner       TEXT DEFAULT '/default-banner.jpg',
    founded_year INTEGER,
    member_count INTEGER DEFAULT 0,
    leader_id    INTEGER REFERENCES users(id),
    leader_name  TEXT,
    contact_email TEXT,
    contact_fb   TEXT,
    leader_fb    TEXT,
    activities   TEXT,
    departments  TEXT,
    is_featured  INTEGER DEFAULT 0,
    created_at   TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS club_members (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id   INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role      TEXT DEFAULT 'member',
    joined_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(club_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id     INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT,
    start_time  TEXT,
    end_time    TEXT,
    location    TEXT,
    image       TEXT,
    status      TEXT DEFAULT 'upcoming',
    created_at  TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS event_registrations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id      INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    registered_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(event_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS applications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id    INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id    INTEGER REFERENCES users(id),
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    major      TEXT,
    year       INTEGER,
    reason     TEXT,
    status     TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS posts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id    INTEGER REFERENCES clubs(id) ON DELETE CASCADE,
    author_id  INTEGER REFERENCES users(id),
    title      TEXT NOT NULL,
    content    TEXT,
    image      TEXT,
    type       TEXT DEFAULT 'news',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS chat_rooms (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id),
    club_id    INTEGER REFERENCES clubs(id),
    status     TEXT DEFAULT 'open',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id    INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id  INTEGER REFERENCES users(id),
    sender_name TEXT,
    content    TEXT NOT NULL,
    is_admin   INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    content    TEXT,
    type       TEXT DEFAULT 'general',
    is_read    INTEGER DEFAULT 0,
    ref_id     INTEGER,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS saved_clubs (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id  INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    saved_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(user_id, club_id)
  );

  CREATE TABLE IF NOT EXISTS club_images (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id     INTEGER NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    public_id   TEXT NOT NULL,
    uploaded_at TEXT DEFAULT (datetime('now','localtime'))
  );
`);

// ── Migrate: add new columns if not exist ──────────────────────────────────
['leader_fb', 'activities', 'departments', 'leader_name'].forEach((col) => {
  try { db.exec(`ALTER TABLE clubs ADD COLUMN ${col} TEXT`); } catch {}
});

// ── Seed ───────────────────────────────────────────────────────────────────

const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (count === 0) {
  console.log('🌱 Seeding database...');

  const hash = (p) => bcrypt.hashSync(p, 10);

  // Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, major, year, bio)
    VALUES (@name, @email, @password, @role, @major, @year, @bio)
  `);

  const users = [
    { name: 'Admin FPT', email: 'admin@fpt.edu.vn', password: hash('admin123'), role: 'admin', major: 'Quản trị', year: 0, bio: 'Quản trị viên hệ thống CLB FPT Đà Nẵng' },
    { name: 'Nguyễn Minh Khôi', email: 'khoi.nm@fpt.edu.vn', password: hash('leader123'), role: 'leader', major: 'Công nghệ thông tin', year: 3, bio: 'Trưởng CLB Lập trình FPT Code' },
    { name: 'Trần Thị Thu Hà', email: 'ha.ttt@fpt.edu.vn', password: hash('leader123'), role: 'leader', major: 'Truyền thông đa phương tiện', year: 3, bio: 'Trưởng CLB FPT Media' },
    { name: 'Lê Văn Đức', email: 'duc.lv@fpt.edu.vn', password: hash('leader123'), role: 'leader', major: 'Marketing', year: 4, bio: 'Trưởng CLB English Plus' },
    { name: 'Phạm Hồng Anh', email: 'anh.ph@fpt.edu.vn', password: hash('user123'), role: 'student', major: 'Công nghệ thông tin', year: 2, bio: 'Sinh viên năm 2 ngành CNTT' },
    { name: 'Võ Thị Lan', email: 'lan.vt@fpt.edu.vn', password: hash('user123'), role: 'student', major: 'Kế toán', year: 1, bio: 'Sinh viên năm nhất, thích âm nhạc và thể thao' },
    { name: 'Hoàng Tuấn Anh', email: 'anh.ht@fpt.edu.vn', password: hash('user123'), role: 'student', major: 'Ngôn ngữ Anh', year: 2, bio: 'Yêu thích tiếng Anh và du lịch' },
  ];

  const userIds = {};
  users.forEach((u) => {
    const result = insertUser.run(u);
    userIds[u.email] = result.lastInsertRowid;
  });

  // Clubs
  const insertClub = db.prepare(`
    INSERT INTO clubs (name, slug, category, short_desc, description, founded_year, member_count, leader_id, leader_name, contact_email, contact_fb, leader_fb, activities, departments, is_featured)
    VALUES (@name, @slug, @category, @short_desc, @description, @founded_year, @member_count, @leader_id, @leader_name, @contact_email, @contact_fb, @leader_fb, @activities, @departments, @is_featured)
  `);

  const clubs = [
    {
      name: 'F2K',
      slug: 'f2k',
      category: 'community',
      short_desc: 'FPT Kindness Krew – thiện nguyện, sẻ chia và trao gửi yêu thương',
      description: 'CLB F2K (FPT Kindness Krew) tại Đại học FPT Đà Nẵng là câu lạc bộ thiện nguyện nổi bật, chuyên tổ chức các hoạt động cộng đồng, sẻ chia và trao gửi yêu thương. Đây là một trong Top 5 CLB xuất sắc nhất tại Đại học FPT Đà Nẵng (kỳ Fall 2025) với tinh thần nhiệt huyết, năng động.\n\nTên đầy đủ: FPT Kindness Krew (CLB Thiện nguyện F2K).\nMục tiêu: Tổ chức các hoạt động tình nguyện, mang lại giá trị thiết thực cho cộng đồng, đặc biệt là giúp đỡ các hoàn cảnh khó khăn.\nHoạt động: Tổ chức các sự kiện thiện nguyện, chương trình quyên góp (ví dụ: quyên góp quần áo ấm cho trẻ em vùng cao, hỗ trợ cộng đồng).\nThành tích: Được vinh danh trong Top 5 CLB xuất sắc nhất kỳ Fall 2025 tại FPTU Đà Nẵng.',
      activities: 'Tổ chức sự kiện văn hóa: F2K thường xuyên tham gia vào các sự kiện lớn của trường như "Hội Làng", tổ chức các gian hàng ẩm thực mang đậm bản sắc văn hóa và tạo sân chơi kết nối, chia sẻ năng lượng tích cực cho sinh viên.\n\nHoạt động thiện nguyện & Cộng đồng: Câu lạc bộ tập trung vào các chương trình thiện nguyện, giúp đỡ cộng đồng (được nhắc đến là "Câu lạc bộ Thiện nguyện - F2K" trong các sự kiện như The Clubverse).',
      departments: JSON.stringify([
        { name: 'Ban Nội dung & Sự kiện', desc: 'Chịu trách nhiệm lên ý tưởng, kịch bản và tổ chức các chương trình tình nguyện, hoạt động xã hội, hội làng và các chiến dịch lan tỏa sự tử tế.' },
        { name: 'Ban Truyền thông', desc: 'Quản lý fanpage, chụp ảnh, quay dựng video, thiết kế ấn phẩm truyền thông để lan tỏa hình ảnh và thông tin của các chương trình.' },
        { name: 'Ban Đối ngoại & Nhân sự', desc: 'Kết nối các thành viên, quản lý nhân sự, và tìm kiếm, làm việc với các nhà tài trợ hoặc đối tác cho các chương trình.' },
      ]),
      founded_year: 2019,
      member_count: 85,
      leader_id: userIds['khoi.nm@fpt.edu.vn'],
      contact_email: 'fpt.kindness.krew@gmail.com',
      contact_fb: 'https://www.facebook.com/share/18EzVZzzmE/?mibextid=wwXIfr',
      leader_name: 'Lê Trần Viết Thịnh',
      leader_fb: 'https://www.facebook.com/share/1CdzUgkPnK/?mibextid=wwXIfr',
      is_featured: 1,
    },
    {
      name: 'FCS',
      slug: 'fcs',
      category: 'art',
      short_desc: 'Fuda\'s Creative Space – bệ phóng cho mọi giấc mơ sáng tạo của người trẻ',
      description: 'Fuda\'s Creative Space (FCS) là câu lạc bộ sáng tạo tại Đại học FPT Đà Nẵng, hoạt động như một bệ phóng cho các ý tưởng sáng tạo của sinh viên thông qua các hoạt động như tổ chức workshop (Lồng đèn Phố Hội), tham quan, và team-building.\nCLB tạo không gian kết nối, văn hóa và nghệ thuật cho sinh viên.\n\nTên: Fuda\'s Creative Space (FCS).\nĐơn vị: Đại học FPT Đà Nẵng.\nLĩnh vực: Sáng tạo, workshop, kết nối cộng đồng sinh viên.\nSứ mệnh: Bệ phóng cho mọi giấc mơ sáng tạo của người trẻ.',
      activities: 'Workshop sáng tạo: Tổ chức các workshop thủ công, ví dụ như "Lung Linh Phố Hội" (làm lồng đèn).\n\nSự kiện trải nghiệm: Tổ chức team-building, tham quan khám phá thành phố Đà Nẵng dành cho sinh viên.\n\nGian hàng văn hóa: Tham gia các ngày hội trường như Hội Làng.',
      departments: JSON.stringify([
        { name: 'Ban Content', desc: 'Team "não bộ ý tưởng" của CLB, phụ trách lên idea, viết bài cho mạng xã hội, viết kịch bản video và phối hợp với các ban khác để phát triển nội dung truyền thông.' },
        { name: 'Ban Media', desc: 'Team bắt trọn mọi khoảnh khắc, phụ trách chụp ảnh, quay video tại các sự kiện và dựng video highlight cho CLB.' },
        { name: 'Ban Design', desc: 'Team tạo nên những sản phẩm hình ảnh "xịn xò", từ poster, banner đến các ấn phẩm truyền thông cho sự kiện và chiến dịch của CLB.' },
        { name: 'Ban Event', desc: 'Team đứng sau các chương trình của CLB, phụ trách lên ý tưởng, lập kế hoạch và tổ chức các sự kiện, workshop hay hoạt động nội bộ.' },
        { name: 'Ban HR', desc: 'Team chăm lo cho "con người" của CLB, phụ trách tuyển thành viên mới, quản lý nhân sự và tổ chức các hoạt động để mọi người gắn kết hơn.' },
      ]),
      founded_year: 2018,
      member_count: 112,
      leader_id: null,
      contact_email: 'fcs.fptudn@gmail.com',
      contact_fb: 'https://www.facebook.com/share/1DZRcMoQR4/?mibextid=wwXIfr',
      leader_name: 'Trần Viết Duy Huy',
      leader_fb: 'https://www.facebook.com/share/17jpsLJ9AB/?mibextid=wwXIfr',
      is_featured: 0,
    },
    {
      name: 'FDN Nunchaku',
      slug: 'fdn-nunchaku',
      category: 'sports',
      short_desc: 'FPTU Nunchaku Club – rèn luyện kỹ thuật côn nhị khúc và tinh thần võ thuật',
      description: 'CLB FDN (FPTU Nunchaku Club) là câu lạc bộ võ thuật tại Trường Đại học FPT, chuyên về Nunchaku (côn nhị khúc) – một loại vũ khí võ thuật nổi tiếng trong các môn võ châu Á. CLB dành cho sinh viên yêu thích võ thuật, biểu diễn kỹ thuật côn và rèn luyện thể chất.\n\nTên đầy đủ: FDN – FPTU Nunchaku Club.\nMục tiêu: Tạo môi trường cho sinh viên rèn luyện sức khỏe, học kỹ thuật côn nhị khúc và phát triển tinh thần võ thuật. Đồng thời, câu lạc bộ giúp sinh viên giao lưu, kết nối và tham gia các hoạt động biểu diễn, sự kiện của trường.\nThành tích: Tham gia biểu diễn võ thuật tại nhiều sự kiện của FPT University, góp phần quảng bá bộ môn Nunchaku trong cộng đồng sinh viên.',
      activities: 'Tập luyện định kỳ: Các buổi tập luyện Nunchaku (côn nhị khúc) định kỳ, workshop hướng dẫn kỹ thuật cho thành viên mới.\n\nBiểu diễn & Giao lưu: Tham gia biểu diễn tại các sự kiện của FPT University, giao lưu võ thuật giữa sinh viên, góp phần lan tỏa tinh thần thể thao và võ thuật trong cộng đồng.',
      departments: null,
      founded_year: 2020,
      member_count: 48,
      leader_id: null,
      contact_email: 'lamgiang.lobal@gmail.com',
      contact_fb: 'https://www.facebook.com/FDNNunchakuCLUB/',
      leader_name: 'Nguyễn Đức Nam',
      leader_fb: null,
      is_featured: 0,
    },
    {
      name: 'FENIOUS',
      slug: 'fenious',
      category: 'art',
      short_desc: 'CLB Văn hóa Ẩm thực – khám phá, lan tỏa giá trị ẩm thực Việt Nam',
      description: 'Fenious là câu lạc bộ Văn hóa Ẩm thực tại Đại học FPT Đà Nẵng (FUDA), chuyên tổ chức các sự kiện, workshop và trải nghiệm khám phá văn hóa ẩm thực Việt Nam. Đây là sân chơi sáng tạo, lan tỏa giá trị ẩm thực, tổ chức các thử thách như "7 ngày trải nghiệm ẩm thực Đà Nẵng" và thường xuyên tuyển thành viên mới.\n\nLĩnh vực: Văn hóa ẩm thực, khám phá và trải nghiệm món ăn.\nMục tiêu: Chia sẻ câu chuyện văn hóa, lan tỏa giá trị Việt, kết nối nghệ thuật và ẩm thực.',
      activities: 'Văn hóa & Ẩm thực: Tổ chức các workshop, sự kiện tìm hiểu và trải nghiệm ẩm thực vùng miền.\n\nThử thách & Trải nghiệm: Chương trình "7 ngày trải nghiệm khám phá nét đẹp ẩm thực Đà Nẵng".\n\nKết nối Nghệ thuật: Hợp tác với Đàling Art Space tổ chức các sự kiện, lan tỏa thông điệp "Thương rứa chớ răng" thông qua ẩm thực.\n\nLan tỏa giá trị: Chia sẻ câu chuyện về văn hóa truyền thống, ký ức và tình người qua các bữa ăn và sản phẩm ẩm thực.',
      departments: JSON.stringify([
        { name: 'Ban Tổ chức/Sự kiện', desc: 'Lên kế hoạch và triển khai các chương trình, hoạt động về ẩm thực.' },
        { name: 'Ban Truyền thông (Media)', desc: 'Chụp ảnh, viết bài, thiết kế hình ảnh, quay dựng video về các món ăn và hoạt động của CLB.' },
        { name: 'Ban Đối ngoại/Nội dung', desc: 'Kết nối, tìm kiếm đối tác và xây dựng nội dung cho các chương trình.' },
        { name: 'Ban Văn hóa/Ẩm thực', desc: 'Nghiên cứu và tìm hiểu về các nét văn hóa ẩm thực đặc sắc.' },
      ]),
      founded_year: 2019,
      member_count: 67,
      leader_id: userIds['ha.ttt@fpt.edu.vn'],
      contact_email: 'fenious.fuda@gmail.com',
      contact_fb: 'https://www.facebook.com/share/1CHn2k3zvW/?mibextid=wwXIfr',
      leader_name: 'Đinh Ngọc Hải Đăng',
      leader_fb: 'https://www.facebook.com/share/18SYYqRBX3/?mibextid=wwXIfr',
      is_featured: 1,
    },
    {
      name: 'FUM',
      slug: 'fum',
      category: 'media',
      short_desc: 'FPT University Media – sáng tạo nội dung, lan tỏa hình ảnh sinh viên FPT',
      description: 'FUM – FPT University Media là câu lạc bộ truyền thông và sáng tạo nội dung của sinh viên Đại học FPT. CLB tập trung vào các lĩnh vực như nhiếp ảnh, quay dựng video, thiết kế và truyền thông sự kiện.\n\nFUM tạo môi trường để các thành viên cùng học hỏi, chia sẻ kinh nghiệm trong lĩnh vực media, đồng thời thực hiện những sản phẩm truyền thông sáng tạo và góp phần lan tỏa hình ảnh, hoạt động sinh viên trong trường.\n\nChủ nhiệm: Huỳnh Vĩnh Uyên | Phó chủ nhiệm: Đặng Anh Thư.',
      activities: null,
      departments: JSON.stringify([
        { name: 'Ban Content', desc: 'Không chỉ viết mà còn kể chuyện bằng con chữ, biến những ý tưởng nhỏ thành nội dung sáng tạo và truyền tải thông điệp rõ ràng của CLB.' },
        { name: 'Ban Visual', desc: 'Team bắt trọn mọi khoảnh khắc, từ chụp ảnh, quay video đến dựng các thước phim sự kiện mang dấu ấn riêng của CLB.' },
        { name: 'Ban Design', desc: 'Nơi ý tưởng được "nhìn thấy", phụ trách thiết kế các ấn phẩm để hình ảnh CLB trở nên sáng tạo và chuyên nghiệp.' },
      ]),
      founded_year: 2017,
      member_count: 143,
      leader_id: null,
      contact_email: 'fumfptdn@gmail.com',
      contact_fb: 'https://www.facebook.com/FUMedia',
      leader_name: 'Huỳnh Vĩnh Uyên',
      leader_fb: null,
      is_featured: 1,
    },
    {
      name: "MIC's Home",
      slug: 'mics-home',
      category: 'art',
      short_desc: 'CLB MC duy nhất của FPT Đà Nẵng – giọng nói, kịch bản và nghệ thuật dẫn chương trình',
      description: "MIC'S HOME - FUDA MC Club là câu lạc bộ MC duy nhất của Trường Đại học FPT Đà Nẵng. CLB chuyên về các kỹ năng giọng nói, biên soạn kịch bản, dẫn chương trình, thành lập với mục tiêu tạo môi trường cởi mở cho các bạn sinh viên có niềm đam mê với giọng nói được học tập và phát triển cùng nhau.\n\nChủ nhiệm: Nguyễn Khánh Nguyên | Phó chủ nhiệm: Trần Lê Nhật Hạ.\n\nLợi ích khi tham gia:\n- Được training về kỹ năng MC, giọng nói với các khách mời, diễn giả có kinh nghiệm.\n- Được training về các khâu tổ chức sự kiện và thực hành thực tế.\n- Có cơ hội thể hiện tài năng MC ở các sân khấu lớn nhỏ.\n- Được training về kỹ năng chụp ảnh, viết content và design.",
      activities: null,
      departments: JSON.stringify([
        { name: 'Ban Chuyên môn', desc: 'Team đứng sau những ý tưởng "xịn xò", phụ trách lên idea cho sự kiện, các buổi training nội bộ và viết kịch bản, nội dung dẫn chương trình.' },
        { name: 'Ban Hậu cần', desc: 'Team đứng sau hậu trường, phụ trách chuẩn bị cơ sở vật chất, sắp xếp nhân sự và phối hợp với các ban khác để sự kiện diễn ra suôn sẻ.' },
        { name: 'Ban Truyền thông', desc: 'Team giúp hình ảnh câu lạc bộ "tỏa sáng", từ chụp ảnh sự kiện, viết content đến thiết kế các ấn phẩm để quảng bá trên fanpage.' },
      ]),
      founded_year: 2021,
      member_count: 54,
      leader_id: null,
      contact_email: 'michome.fptu.dn@gmail.com',
      contact_fb: 'https://www.facebook.com/michome.vn',
      leader_name: 'Nguyễn Khánh Nguyên',
      leader_fb: null,
      is_featured: 0,
    },
    {
      name: 'Rhythm',
      slug: 'rhythm',
      category: 'art',
      short_desc: 'Rhythm – Xưởng Làm Nhạc – sáng tác, sản xuất và biểu diễn âm nhạc',
      description: 'Rhythm – Xưởng Làm Nhạc là câu lạc bộ tập trung vào sáng tác, sản xuất và biểu diễn âm nhạc tại FPT University Đà Nẵng. CLB tạo môi trường để các thành viên cùng học hỏi, chia sẻ kỹ năng làm nhạc và phát triển những sản phẩm âm nhạc sáng tạo, đồng thời xây dựng một cộng đồng những người trẻ đam mê âm nhạc.\n\nChủ nhiệm: Lê Minh Phúc | Phó chủ nhiệm: Võ Phạm Mỹ.\nYouTube: youtube.com/@Rhythmxuonglamnhac',
      activities: null,
      departments: JSON.stringify([
        { name: 'Ban Talent', desc: 'Nơi hội tụ những giọng hát nổi bật, phụ trách sáng tác và biểu diễn để mang đến những tiết mục thật ấn tượng cho chương trình.' },
        { name: 'Ban Producer', desc: 'Nơi dành cho những bạn đam mê làm nhạc, từ phối nhạc đến biểu diễn các nhạc cụ để tạo nên phần âm nhạc thật chất.' },
        { name: 'Ban Media', desc: 'Nơi chuyên "bắt trọn mọi khoảnh khắc" của chương trình – từ quay phim, chụp ảnh đến thiết kế nội dung để quảng bá trên các nền tảng truyền thông.' },
        { name: 'Ban Event', desc: 'Đội ngũ đứng sau hậu trường, phụ trách lên ý tưởng, chuẩn bị và tổ chức các hoạt động để sự kiện diễn ra thật sôi động và suôn sẻ.' },
      ]),
      founded_year: 2018,
      member_count: 96,
      leader_id: null,
      contact_email: 'rhythm.xuonglamnhac@gmail.com',
      contact_fb: 'https://www.facebook.com/xuonglamnhac.fptdn',
      leader_name: 'Lê Minh Phúc',
      leader_fb: null,
      is_featured: 1,
    },
    {
      name: 'SRC',
      slug: 'src',
      category: 'technology',
      short_desc: 'Security Research Club – cộng đồng sinh viên đam mê an toàn thông tin và cybersecurity',
      description: 'SRC - Security Research Club (CLB An toàn thông tin) là câu lạc bộ học thuật dành cho sinh viên quan tâm đến an ninh mạng và bảo mật thông tin, thành lập nhằm tạo môi trường cho sinh viên học tập, nghiên cứu và thực hành về an toàn thông tin, bao gồm các lĩnh vực như bảo mật hệ thống, kiểm thử xâm nhập (pentest), và phòng chống tấn công mạng.\n\nTên đầy đủ: SRC - Security Research Club (CLB An toàn thông tin).\nMục tiêu: Nâng cao kiến thức về cybersecurity cho sinh viên, phát triển kỹ năng phân tích lỗ hổng và bảo mật hệ thống, tạo cộng đồng sinh viên đam mê an toàn thông tin.\nThành tích: Tham gia nhiều cuộc thi CTF về an toàn thông tin, xây dựng cộng đồng học tập và chia sẻ kiến thức về cybersecurity cho sinh viên trong trường.',
      activities: 'Workshop & Training: Tổ chức các workshop, training và seminar về bảo mật hệ thống, web security, network security và kiểm thử xâm nhập (penetration testing).\n\nThực hành & Nghiên cứu: Tạo môi trường để thành viên thực hành qua các bài lab, dự án nghiên cứu và mô phỏng các cuộc tấn công – phòng thủ trong hệ thống mạng.\n\nCapture The Flag (CTF): Tích cực tham gia và tổ chức các cuộc thi CTF, nơi sinh viên rèn luyện kỹ năng giải quyết vấn đề và tư duy bảo mật trong môi trường thực tế.',
      departments: null,
      founded_year: 2016,
      member_count: 78,
      leader_id: userIds['duc.lv@fpt.edu.vn'],
      contact_email: 'clubscrtrsrch@gmail.com',
      contact_fb: 'https://www.facebook.com/SybP3n0r?locale=vi_VN',
      leader_name: 'Hoàng Văn Khánh',
      leader_fb: null,
      is_featured: 0,
    },
    {
      name: 'EVO',
      slug: 'evo',
      category: 'community',
      short_desc: 'FUDA Event Club – trang bị kỹ năng sự kiện, kết nối cộng đồng sinh viên FPT',
      description: 'EVO – FUDA Event Club là câu lạc bộ tổ chức sự kiện của Trường Đại học FPT Đà Nẵng, nơi trang bị cho sinh viên những kỹ năng cần thiết và trau dồi kinh nghiệm trong ngành sự kiện.\n\nEVO tập trung vào việc tổ chức, quản lý và thực hiện các hoạt động sự kiện, chương trình giải trí – học thuật – giao lưu trong cộng đồng sinh viên, giúp họ phát triển kỹ năng tổ chức, truyền thông và sáng tạo (ví dụ: Hội Làng 2026,...).\n\nThành tích: 6 kỳ liên tiếp đạt Top 5 CLB xuất sắc.',
      activities: 'Tổ chức sự kiện: Lên kế hoạch và thực hiện các chương trình giải trí, học thuật và giao lưu trong cộng đồng sinh viên tại FPT University Đà Nẵng.\n\nPhát triển kỹ năng: Trang bị cho thành viên các kỹ năng tổ chức sự kiện, truyền thông, kỹ thuật âm thanh – ánh sáng và sáng tạo nội dung thực tế.',
      departments: JSON.stringify([
        { name: 'Ban Truyền thông', desc: 'Xây dựng và lan tỏa hình ảnh, giá trị của EVo đến cộng đồng thông qua nội dung, hình ảnh và thông điệp sáng tạo; đồng thời hỗ trợ truyền thông cho các sự kiện và hoạt động của CLB.' },
        { name: 'Ban Nội dung', desc: 'Lên ý tưởng, xây dựng nội dung và kịch bản cho các sự kiện của EVo, đảm bảo mỗi chương trình có câu chuyện rõ ràng, ý nghĩa và mang lại trải nghiệm kết nối cho người tham gia.' },
        { name: 'Ban Hậu cần', desc: 'Chuẩn bị cơ sở vật chất, thiết bị và hỗ trợ vận hành phía sau sân khấu, đảm bảo mọi hoạt động và sự kiện của EVo diễn ra suôn sẻ, đúng kế hoạch.' },
        { name: 'Ban Kỹ thuật', desc: 'Phụ trách các hạng mục kỹ thuật như âm thanh, ánh sáng, trình chiếu và hỗ trợ kỹ thuật, đảm bảo các sự kiện của EVo diễn ra ổn định và trơn tru.' },
        { name: 'Ban Cố vấn', desc: 'Định hướng chiến lược, tư vấn chuyên môn và hỗ trợ Ban điều hành để các hoạt động, sự kiện của EVo được triển khai hiệu quả và đúng hướng.' },
        { name: 'Ban Chủ nhiệm', desc: 'Lãnh đạo và điều hành các hoạt động của EVo, định hướng phát triển CLB, kết nối các ban và đảm bảo mọi dự án, sự kiện được tổ chức hiệu quả.' },
      ]),
      founded_year: 2020,
      member_count: 130,
      leader_id: userIds['khoi.nm@fpt.edu.vn'],
      contact_email: 'evo.fptudn@gmail.com',
      contact_fb: 'https://www.facebook.com/EVoEventClub',
      leader_name: 'Võ Công Đạt',
      leader_fb: null,
      is_featured: 1,
    },
    {
      name: 'FIC',
      slug: 'fic',
      category: 'academic',
      short_desc: 'Financial Investing Club – khám phá tài chính, đầu tư từ ghế giảng đường',
      description: 'FIC – Financial Investing Club là câu lạc bộ dành cho sinh viên muốn xây dựng nền tảng tài chính vững chắc ngay từ khi còn ngồi trên ghế giảng đường. FIC giúp bạn khám phá kiến thức tài chính hấp dẫn, dễ hiểu và thực tế, trải nghiệm môi trường học tập sôi động, tham gia các buổi training chất lượng với nhiều chủ đề "hot" và giao lưu qua các cuộc thi, sự kiện độc đáo.\n\nChủ nhiệm: Huy Trần | Phó chủ nhiệm: Phúc Hiếu.',
      activities: 'Workshop & Training: Tổ chức các buổi training về tài chính, đầu tư, phân tích thị trường và các chủ đề kinh tế nổi bật.\n\nCuộc thi & Sự kiện: Giao lưu qua các cuộc thi tài chính và sự kiện độc đáo, giúp thành viên thực hành kỹ năng và mở rộng mạng lưới.',
      departments: JSON.stringify([
        { name: 'Ban Chuyên Môn', desc: 'Dành cho bạn muốn tìm hiểu tài chính từ A-Z, viết tài liệu, chia sẻ kiến thức và cùng team tổ chức training.' },
        { name: 'Ban Truyền Thông', desc: 'Dành cho bạn thích sáng tạo nội dung, làm content, thiết kế đẹp mắt và lan tỏa kiến thức đến nhiều người.' },
        { name: 'Ban Media', desc: 'Nơi chuyên "bắt trọn mọi khoảnh khắc" của chương trình – từ quay phim, chụp ảnh đến thiết kế nội dung để quảng bá trên các nền tảng truyền thông.' },
      ]),
      founded_year: 2019,
      member_count: 72,
      leader_id: userIds['ha.ttt@fpt.edu.vn'],
      contact_email: null,
      contact_fb: null,
      leader_name: 'Huy Trần',
      leader_fb: null,
      is_featured: 0,
    },
    {
      name: 'Resup',
      slug: 'resup',
      category: 'academic',
      short_desc: 'ResUp – Business & Marketing Club – phát triển tư duy kinh doanh, marketing và khởi nghiệp',
      description: 'ResUp – Business & Marketing Club là câu lạc bộ dành cho những bạn trẻ đam mê kinh doanh và marketing, mong muốn phát triển tư duy sáng tạo, kỹ năng thực tế và tinh thần khởi nghiệp. Với môi trường năng động và cởi mở, ResUp hướng đến việc xây dựng một cộng đồng nơi các thành viên có thể học hỏi, chia sẻ kinh nghiệm và cùng nhau phát triển.\n\nChủ nhiệm: Nguyễn Đỗ Thanh Uyên | Phó Chủ nhiệm: Nguyễn Hải Sơn.\n\nKhẩu hiệu: Phát triển – Sáng tạo – Bứt phá.',
      activities: 'Workshop & Training: Tổ chức workshop về marketing, kinh doanh, các buổi training kỹ năng và dự án thực tế.\n\nKết nối cộng đồng: Cơ hội kết nối với những người cùng định hướng, rèn luyện kỹ năng làm việc nhóm, tư duy chiến lược và khả năng giải quyết vấn đề.',
      departments: JSON.stringify([
        { name: 'Ban Truyền thông', desc: 'Người đứng sau những hình ảnh, bài viết và chiến dịch truyền thông mang đậm dấu ấn ResUp. Xây dựng hình ảnh CLB ngày càng chuyên nghiệp, sáng tạo và gần gũi.' },
        { name: 'Ban Chuyên môn', desc: '"Xương sống" cho các hoạt động chuyên môn của ResUp. Các buổi training, cuộc thi và nội dung học thuật chất lượng đều mang dấu ấn ban này.' },
        { name: 'Ban Nhân sự', desc: 'Người kết nối các thành viên, xây dựng một ResUp gắn kết, tích cực và đầy năng lượng – nơi mỗi cá nhân đều được lắng nghe, hỗ trợ và phát triển.' },
      ]),
      founded_year: 2021,
      member_count: 61,
      leader_id: null,
      contact_email: null,
      contact_fb: null,
      leader_name: 'Nguyễn Đỗ Thanh Uyên',
      leader_fb: null,
      is_featured: 0,
    },
    {
      name: 'FCC',
      slug: 'fcc',
      category: 'academic',
      short_desc: 'FPTU Chinese Club – học tiếng Trung miễn phí, khám phá văn hóa Trung Hoa',
      description: 'FPT Chinese Club (FCC) – Câu lạc bộ Tiếng Trung Đại học FPT chính thức ra mắt ngày 15/09/2014 nhằm giúp sinh viên có cơ hội học tiếng Trung hoàn toàn miễn phí với những buổi học chất lượng từ các thành viên Ban Học thuật của CLB.\n\nKhông chỉ dừng lại ở ngôn ngữ, FCC còn mang đến cơ hội khám phá nền văn hóa Trung Hoa đa sắc màu thông qua các hoạt động giao lưu, tìm hiểu nghệ thuật đặc sắc, team building và hoạt động ngoại khóa.\n\nChủ nhiệm: Trần Phương Anh | Phó chủ nhiệm: Nguyễn Thị Hồng Thuyên.',
      activities: null,
      departments: JSON.stringify([
        { name: 'Ban Văn Hóa', desc: 'Nơi giữ gìn và lan tỏa những khoảnh khắc đẹp nhất của CLB, từ sự gắn kết giữa các thành viên, tinh thần đồng đội đến những kỷ niệm nhỏ bé nhưng đầy ý nghĩa trong mỗi hành trình cùng nhau.' },
        { name: 'Ban Học Thuật', desc: 'Kết nối ngôn ngữ Trung Hoa đến gần hơn với cộng đồng. Tìm kiếm những bạn có nền tảng tiếng Trung từ HSK3 trở lên, yêu thích ngôn ngữ Trung Hoa, cẩn thận với câu chữ và sẵn sàng học hỏi.' },
        { name: 'Ban Nội Dung', desc: 'Dệt nên mạch truyện và thổi sinh khí vào từng hoạt động, biến mỗi khoảnh khắc sự kiện thành một chương ký ức đáng nhớ.' },
        { name: 'Ban Truyền Thông', desc: 'Hội tụ những người có con mắt tinh anh và trái tim sáng tạo, dùng ngôn từ và hình ảnh để lan truyền thông điệp và giữ cho CLB luôn nhộn nhịp.' },
      ]),
      founded_year: 2014,
      member_count: 55,
      leader_id: null,
      contact_email: 'tiengtrungfpt@gmail.com',
      contact_fb: null,
      leader_name: 'Trần Phương Anh',
      leader_fb: null,
      is_featured: 0,
    },
    {
      name: 'FUB Club',
      slug: 'fub-club',
      category: 'sports',
      short_desc: 'FPTU Badminton Club – sân chơi cầu lông năng động cho sinh viên FPT Đà Nẵng',
      description: 'CLB FUB (FPTU Badminton Club) tại FPT University cơ sở Đà Nẵng là câu lạc bộ thể thao dành cho các bạn sinh viên yêu thích bộ môn cầu lông. CLB được thành lập với mục tiêu tạo ra một môi trường năng động, nơi các bạn sinh viên có thể rèn luyện sức khỏe, phát triển kỹ năng và giao lưu với những người có cùng đam mê.\n\nTên đầy đủ: FPTU Badminton Club (CLB Cầu lông FUB).\nMục tiêu: Xây dựng cộng đồng sinh viên yêu thích cầu lông, tạo môi trường luyện tập, phát triển kỹ năng thể thao và nâng cao sức khỏe cho sinh viên.',
      activities: 'Tập luyện định kỳ: Tổ chức các buổi tập luyện cầu lông định kỳ cho thành viên và các giải đấu nội bộ trong CLB.\n\nGiao lưu & Thi đấu: Giao lưu thi đấu với các CLB cầu lông khác, tham gia các hoạt động thể thao và sự kiện của trường.',
      departments: JSON.stringify([
        { name: 'Ban Nội dung & Sự kiện', desc: 'Chịu trách nhiệm lên ý tưởng, kế hoạch và tổ chức các buổi tập luyện, giải đấu cầu lông cũng như các hoạt động giao lưu của CLB.' },
        { name: 'Ban Truyền thông', desc: 'Quản lý fanpage, chụp ảnh, quay video và thiết kế các ấn phẩm truyền thông để quảng bá hoạt động của CLB.' },
        { name: 'Ban Đối ngoại & Nhân sự', desc: 'Kết nối các thành viên, quản lý nhân sự và làm việc với các đối tác, nhà tài trợ cho các hoạt động của CLB.' },
      ]),
      founded_year: 2018,
      member_count: 68,
      leader_id: null,
      contact_email: null,
      contact_fb: 'https://www.facebook.com/FUBadmintonClubDN',
      leader_name: null,
      leader_fb: null,
      is_featured: 0,
    },
    {
      name: 'FVC Club',
      slug: 'fvc-club',
      category: 'sports',
      short_desc: 'FPTU Vovinam Club – rèn luyện võ thuật truyền thống Việt Nam, tinh thần võ đạo',
      description: 'CLB FVC (FPTU Vovinam Club) tại FPT University cơ sở Đà Nẵng là câu lạc bộ võ thuật dành cho sinh viên yêu thích Vovinam – Việt Võ Đạo. CLB được thành lập nhằm tạo môi trường luyện tập, rèn luyện thể chất và phát triển tinh thần võ đạo cho sinh viên trong trường.\n\nFVC là nơi các bạn sinh viên có thể rèn luyện sức khỏe, học kỹ năng tự vệ và giao lưu với những người có cùng đam mê võ thuật.\n\nTên đầy đủ: FPTU Vovinam Club (CLB Võ thuật FVC).\nChủ nhiệm: Hồ Quang Triều | Phó ban chủ nhiệm: Mai Hà Yến & Nguyễn Cao Văn Nhân.\nMục tiêu: Xây dựng môi trường luyện tập võ thuật lành mạnh, giúp sinh viên rèn luyện thể lực, kỷ luật và tinh thần đoàn kết.',
      activities: 'Tập luyện Vovinam: Tổ chức các buổi tập luyện Vovinam định kỳ, phát triển kỹ năng tự vệ cho thành viên.\n\nBiểu diễn & Giao lưu: Tham gia biểu diễn võ thuật trong các sự kiện của trường, giao lưu võ thuật với các CLB khác.',
      departments: JSON.stringify([
        { name: 'Ban Nội dung & Sự kiện', desc: 'Lên ý tưởng, xây dựng kế hoạch và tổ chức các buổi tập luyện, sự kiện võ thuật và hoạt động giao lưu của CLB.' },
        { name: 'Ban Truyền thông', desc: 'Quản lý fanpage, chụp ảnh, quay video và thiết kế các ấn phẩm truyền thông để quảng bá hoạt động của CLB.' },
        { name: 'Ban Đối ngoại & Nhân sự', desc: 'Kết nối các thành viên, quản lý nhân sự và tìm kiếm đối tác, nhà tài trợ cho các hoạt động của CLB.' },
      ]),
      founded_year: 2017,
      member_count: 89,
      leader_id: null,
      contact_email: null,
      contact_fb: 'https://www.facebook.com/Fvcudn',
      leader_name: 'Hồ Quang Triều',
      leader_fb: null,
      is_featured: 0,
    },
    {
      name: 'NYS Club',
      slug: 'nys-club',
      category: 'art',
      short_desc: 'Nam Your Soul – sân chơi âm nhạc và nghệ thuật biểu diễn',
      description: 'NYS Club (Nam Your Soul) là câu lạc bộ âm nhạc và nghệ thuật biểu diễn của FPT University Đà Nẵng. Đây là nơi các bạn trẻ yêu âm nhạc, ca hát và nghệ thuật sân khấu cùng nhau luyện tập, sáng tạo và tỏa sáng. NYS tổ chức các buổi jam session, concert nội bộ, tham gia biểu diễn trong các sự kiện lớn của trường và các chương trình giao lưu văn nghệ. Chủ nhiệm: Ngô Thục Anh | Phó chủ nhiệm: Nguyễn Thị Yến Nhi. TikTok: https://www.tiktok.com/@nysdangiu',
      founded_year: 2018,
      member_count: 83,
      leader_id: null,
      contact_email: 'nysclubfptu@gmail.com',
      contact_fb: 'https://www.facebook.com/nysclubdn/',
      leader_name: 'Ngô Thục Anh',
      leader_fb: null,
      activities: 'Tập luyện âm nhạc và ca hát định kỳ; Tổ chức jam session và concert nội bộ; Biểu diễn tại các sự kiện lớn của trường; Sản xuất nội dung âm nhạc lên mạng xã hội; Giao lưu văn nghệ với các CLB và trường bạn',
      departments: JSON.stringify([
        { name: 'Ban Instrument', desc: 'Phụ trách luyện tập và biểu diễn nhạc cụ (guitar, piano, bass, trống...). Hỗ trợ âm thanh và nhạc nền cho các chương trình biểu diễn của CLB.' },
        { name: 'Ban Vocal', desc: 'Tập hợp các giọng ca của CLB, luyện tập thanh nhạc và biểu diễn ca hát tại các sự kiện. Tổ chức các buổi thi giọng hát nội bộ để phát hiện tài năng mới.' },
        { name: 'Ban Event', desc: 'Xây dựng nội dung, kịch bản chương trình và quản lý mạng xã hội của CLB. Lên kế hoạch tổ chức các sự kiện biểu diễn và quảng bá hình ảnh NYS Club.' },
      ]),
      is_featured: 1,
    },
    {
      name: 'TIA',
      slug: 'tia',
      category: 'art',
      short_desc: 'FPT Traditional Instruments Abide – gìn giữ âm nhạc dân tộc Việt Nam',
      description: 'TIA (FPT Traditional Instruments Abide Club) là nơi dành cho những sinh viên yêu thích và mong muốn tìm hiểu, bảo tồn và phát triển âm nhạc truyền thống Việt Nam thông qua các loại nhạc cụ dân tộc. Câu lạc bộ tạo môi trường để các thành viên học tập, luyện tập và biểu diễn những giai điệu mang đậm bản sắc văn hóa Việt. Mục tiêu: Gìn giữ và lan tỏa giá trị âm nhạc dân tộc trong cộng đồng sinh viên, tạo sân chơi cho các bạn yêu thích nhạc cụ truyền thống, phát triển kỹ năng biểu diễn và làm việc nhóm.',
      founded_year: 2017,
      member_count: 158,
      leader_id: null,
      contact_email: 'tia.fptdn@gmail.com',
      contact_fb: 'https://www.facebook.com/TIACLUBNHACCUDANTOC/',
      leader_name: null,
      leader_fb: null,
      activities: 'Tập luyện và học chơi các nhạc cụ dân tộc; Biểu diễn tại các sự kiện văn hóa – nghệ thuật của trường; Tổ chức workshop và giao lưu với người yêu âm nhạc truyền thống; Tham gia các chương trình, lễ hội quảng bá văn hóa Việt',
      departments: JSON.stringify([
        { name: 'Ban Truyền Thông', desc: 'Sáng tạo nội dung, hình ảnh và video để ghi lại, quảng bá và lan tỏa hoạt động của CLB.' },
        { name: 'Ban Sự Kiện', desc: 'Chuẩn bị kỹ thuật, hậu cần và vận hành sân khấu, đảm bảo các chương trình diễn ra suôn sẻ.' },
        { name: 'Ban Chuyên Môn', desc: 'Phụ trách lựa chọn tác phẩm, phối khí, dàn dựng và luyện tập các tiết mục biểu diễn, đồng thời phát triển và trình bày âm nhạc dân tộc nhằm mang đến những màn trình diễn chất lượng và ấn tượng cho khán giả.' },
      ]),
      is_featured: 1,
    },
  ];

  const clubIds = {};
  clubs.forEach((c) => {
    const result = insertClub.run(c);
    clubIds[c.slug] = result.lastInsertRowid;
  });

  // Club members
  const insertMember = db.prepare(`
    INSERT OR IGNORE INTO club_members (club_id, user_id, role) VALUES (?, ?, ?)
  `);
  insertMember.run(clubIds['f2k'], userIds['khoi.nm@fpt.edu.vn'], 'leader');
  insertMember.run(clubIds['evo'], userIds['anh.ph@fpt.edu.vn'], 'member');
  insertMember.run(clubIds['fic'], userIds['ha.ttt@fpt.edu.vn'], 'leader');
  insertMember.run(clubIds['nys-club'], userIds['ha.ttt@fpt.edu.vn'], 'leader');
  insertMember.run(clubIds['src'], userIds['duc.lv@fpt.edu.vn'], 'leader');
  insertMember.run(clubIds['src'], userIds['anh.ht@fpt.edu.vn'], 'member');
  insertMember.run(clubIds['tia'], userIds['lan.vt@fpt.edu.vn'], 'member');

  // Events
  const insertEvent = db.prepare(`
    INSERT INTO events (club_id, title, description, start_time, end_time, location, status)
    VALUES (@club_id, @title, @description, @start_time, @end_time, @location, @status)
  `);

  const events = [
    {
      club_id: clubIds['evo'],
      title: 'EVO Tournament: Valorant Championship S1',
      description: 'Giải đấu Valorant nội bộ FPT Đà Nẵng với 16 đội tham gia. Tổng giải thưởng 5 triệu đồng cùng nhiều phần quà hấp dẫn từ các nhà tài trợ gaming.',
      start_time: '2026-03-20 09:00:00',
      end_time: '2026-03-20 18:00:00',
      location: 'Phòng Lab máy tính A2.01, FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['f2k'],
      title: 'F2K Battle Royale – Street Dance Competition',
      description: 'Cuộc thi battle street dance mở với các thể loại B-boy, Popping, Locking. Mở cửa cho tất cả sinh viên FPT và các trường đại học khác tại Đà Nẵng.',
      start_time: '2026-03-22 14:00:00',
      end_time: '2026-03-22 20:00:00',
      location: 'Sân khấu ngoài trời, FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['fum'],
      title: 'FUM Spring Concert 2026 – "Giai Điệu Mùa Xuân"',
      description: 'Đêm nhạc hội mùa xuân với hơn 20 tiết mục từ acoustic, pop đến band. Sự kiện âm nhạc lớn nhất học kỳ do FUM tổ chức.',
      start_time: '2026-04-10 19:00:00',
      end_time: '2026-04-10 21:30:00',
      location: 'Sân khấu ngoài trời, FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['nys-club'],
      title: 'NYS Workshop: Kỹ năng MC & Dẫn chương trình',
      description: 'Workshop thực hành kỹ năng MC, dẫn chương trình sự kiện chuyên nghiệp. Giảng viên là các MC có kinh nghiệm tại Đà Nẵng.',
      start_time: '2026-03-18 14:00:00',
      end_time: '2026-03-18 17:00:00',
      location: 'Phòng hội thảo B1.02, FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['tia'],
      title: 'TIA – Ngày hội Hiến máu nhân đạo Mùa Xuân',
      description: 'Chương trình hiến máu nhân đạo do TIA phối hợp với Bệnh viện Đà Nẵng tổ chức. Mỗi đơn vị máu là một sinh mệnh được cứu sống.',
      start_time: '2026-03-25 07:30:00',
      end_time: '2026-03-25 11:30:00',
      location: 'Hội trường FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['fvc-club'],
      title: 'FVC – Giải Bóng chuyền Sinh viên FPT Mở rộng',
      description: 'Giải bóng chuyền giao hữu giữa các khoa và các trường đại học tại Đà Nẵng. Hơn 16 đội tham gia ở cả nội dung nam và nữ.',
      start_time: '2026-04-05 07:00:00',
      end_time: '2026-04-06 17:00:00',
      location: 'Sân thể thao FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['rhythm'],
      title: 'Rhythm Showcase – K-pop & Contemporary Night',
      description: 'Đêm biểu diễn vũ đạo với các m��n trình diễn K-pop cover và Contemporary dance. Rhythm mở cửa miễn phí cho toàn thể sinh viên FPT.',
      start_time: '2026-04-15 19:00:00',
      end_time: '2026-04-15 21:00:00',
      location: 'Sân khấu ngoài trời, FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['fic'],
      title: 'FIC – Workshop: Quay phim bằng điện thoại',
      description: 'Học kỹ thuật quay phim chuyên nghiệp chỉ với chiếc điện thoại thông minh. Bao gồm cả kỹ năng dựng phim và chỉnh màu cơ bản.',
      start_time: '2026-03-28 09:00:00',
      end_time: '2026-03-28 12:00:00',
      location: 'Phòng Studio Media, Tầng 3 nhà A, FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['fdn-nunchaku'],
      title: 'FDN Nunchaku – Biểu diễn võ thuật nghệ thuật',
      description: 'Chương trình biểu diễn nghệ thuật nunchaku kết hợp múa và võ thuật. FDN Nunchaku mang đến những màn trình diễn mãn nhãn và đầy sức mạnh.',
      start_time: '2026-03-30 15:00:00',
      end_time: '2026-03-30 17:00:00',
      location: 'Sân khấu FPT University Đà Nẵng',
      status: 'upcoming',
    },
    {
      club_id: clubIds['evo'],
      title: 'EVO LAN Party – Free Fire & PUBG Mobile',
      description: 'Buổi LAN Party thi đấu Free Fire và PUBG Mobile thân thiện, dành cho tất cả sinh viên FPT. Có quà tặng và snack miễn phí cho người tham gia.',
      start_time: '2026-02-20 13:00:00',
      end_time: '2026-02-20 18:00:00',
      location: 'Phòng Lab A2.02, FPT University Đà Nẵng',
      status: 'past',
    },
  ];

  events.forEach((e) => insertEvent.run(e));

  // Posts
  const insertPost = db.prepare(`
    INSERT INTO posts (club_id, author_id, title, content, type)
    VALUES (@club_id, @author_id, @title, @content, @type)
  `);

  const posts = [
    {
      club_id: clubIds['evo'],
      author_id: userIds['khoi.nm@fpt.edu.vn'],
      title: '🏆 EVO vô địch giải Valorant sinh viên Đà Nẵng 2023',
      content: 'Đội tuyển EVO đã xuất sắc giành chức vô địch giải Valorant sinh viên thành phố Đà Nẵng 2023, đánh bại 32 đội đến từ các trường đại học khác. Đây là kết quả của 3 tháng tập luyện miệt mài và sự đoàn kết của toàn đội. Chúc mừng các chiến binh EVO!',
      type: 'achievement',
    },
    {
      club_id: clubIds['fum'],
      author_id: userIds['admin@fpt.edu.vn'],
      title: '📢 FUM tuyển thành viên mới HK2/2024 – Đừng bỏ lỡ!',
      content: 'FUM đang tìm kiếm những tài năng âm nhạc mới để gia nhập gia đình. Chúng tôi chào đón ca sĩ, nhạc công, nhà soạn nhạc và cả những bạn chỉ đơn giản là yêu âm nhạc. Hạn đăng ký: 25/03/2024. Đăng ký ngay tại trang CLB hoặc liên hệ fanpage.',
      type: 'recruitment',
    },
    {
      club_id: clubIds['tia'],
      author_id: userIds['admin@fpt.edu.vn'],
      title: '❤️ TIA – Recap chuyến tình nguyện tại Huyện Hoà Vang',
      content: 'Chuyến tình nguyện hè 2023 tại Huyện Hoà Vang đã khép lại với những kết quả đáng tự hào. 120 tình nguyện viên TIA đã sơn sửa 6 phòng học, tặng 300 phần quà cho các em nhỏ và tổ chức ngày hội vui chơi với hơn 400 em tham gia. Cảm ơn tất cả những trái tim đã cùng nhau hành động!',
      type: 'recap',
    },
    {
      club_id: clubIds['nys-club'],
      author_id: userIds['ha.ttt@fpt.edu.vn'],
      title: '🎬 NYS Club hoàn thành xuất sắc Gala Cuối năm 2023',
      content: 'Đêm Gala Cuối năm 2023 do NYS Club sản xuất và tổ chức đã thu hút hơn 800 sinh viên tham dự. Với 4 tháng chuẩn bị công phu, NYS Club đã mang đến một đêm diễn hoành tráng với 15 tiết mục từ các CLB khác nhau trong trường.',
      type: 'recap',
    },
    {
      club_id: clubIds['f2k'],
      author_id: userIds['khoi.nm@fpt.edu.vn'],
      title: '💃 F2K tham gia Street Dance Championship Đà Nẵng 2023',
      content: 'Đội F2K đã xuất sắc lọt vào Top 3 tại Street Dance Championship Đà Nẵng 2023. Phần biểu diễn B-boy và Popping của đội nhận được nhiều tràng vỗ tay từ khán giả và ban giám khảo. Đây là động lực lớn để F2K tiếp tục chinh phục những đỉnh cao mới!',
      type: 'achievement',
    },
    {
      club_id: clubIds['fvc-club'],
      author_id: userIds['admin@fpt.edu.vn'],
      title: '🏐 FVC Club – Á quân giải Bóng chuyền Sinh viên TP. Đà Nẵng',
      content: 'Đội bóng chuyền nữ FVC Club đã giành được danh hiệu Á quân tại giải Bóng chuyền Sinh viên thành phố Đà Nẵng. Sau một hành trình thi đấu đầy cảm xúc, các bạn đã thể hiện được tinh thần đồng đội và kỹ thuật thi đấu xuất sắc. Chúc mừng toàn thể FVC Club!',
      type: 'achievement',
    },
  ];

  posts.forEach((p) => insertPost.run(p));

  // Applications
  const insertApp = db.prepare(`
    INSERT INTO applications (club_id, user_id, name, email, major, year, reason, status)
    VALUES (@club_id, @user_id, @name, @email, @major, @year, @reason, @status)
  `);

  const apps = [
    { club_id: clubIds['evo'], user_id: userIds['anh.ph@fpt.edu.vn'], name: 'Phạm Hồng Anh', email: 'anh.ph@fpt.edu.vn', major: 'CNTT', year: 2, reason: 'Tôi đam mê esports và muốn tham gia cộng đồng gaming tại FPT, đặc biệt là Valorant.', status: 'approved' },
    { club_id: clubIds['src'], user_id: userIds['anh.ht@fpt.edu.vn'], name: 'Hoàng Tuấn Anh', email: 'anh.ht@fpt.edu.vn', major: 'Ngôn ngữ Anh', year: 2, reason: 'Muốn đại diện cho sinh viên trong hội đồng và đóng góp ý kiến xây dựng trường.', status: 'approved' },
    { club_id: clubIds['tia'], user_id: userIds['lan.vt@fpt.edu.vn'], name: 'Võ Thị Lan', email: 'lan.vt@fpt.edu.vn', major: 'Kế toán', year: 1, reason: 'Tôi muốn đóng góp cho cộng đồng và trải nghiệm hoạt động tình nguyện ý nghĩa.', status: 'pending' },
    { club_id: clubIds['fic'], user_id: null, name: 'Nguyễn Thị Bảo Châu', email: 'chau.ntb@gmail.com', major: 'TTĐPT', year: 2, reason: 'Yêu thích nhiếp ảnh và làm phim, muốn học hỏi và phát triển cùng FIC.', status: 'pending' },
    { club_id: clubIds['fvc-club'], user_id: null, name: 'Trần Văn Hùng', email: 'hung.tv@gmail.com', major: 'QTKD', year: 3, reason: 'Đam mê bóng chuyền từ cấp 3, muốn tiếp tục thi đấu và kết bạn với đồng đội.', status: 'rejected' },
  ];

  apps.forEach((a) => insertApp.run(a));

  // Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, title, content, type, ref_id)
    VALUES (@user_id, @title, @content, @type, @ref_id)
  `);

  insertNotif.run({ user_id: userIds['anh.ph@fpt.edu.vn'], title: 'Đơn đăng ký đã được duyệt!', content: 'Chúc mừng! Đơn đăng ký tham gia CLB EVO của bạn đã được chấp nhận.', type: 'application', ref_id: clubIds['evo'] });
  insertNotif.run({ user_id: userIds['anh.ht@fpt.edu.vn'], title: 'Đơn đăng ký đã được duyệt!', content: 'Chúc mừng! Đơn đăng ký tham gia CLB SRC của bạn đã được chấp nhận.', type: 'application', ref_id: clubIds['src'] });
  insertNotif.run({ user_id: userIds['anh.ph@fpt.edu.vn'], title: 'Sự kiện sắp diễn ra!', content: 'EVO Tournament: Valorant Championship S1 sẽ diễn ra vào ngày 20/03/2026. Đừng quên đăng ký!', type: 'event', ref_id: 1 });

  console.log('✅ Database seeded successfully!');
  console.log('📧 Admin: admin@fpt.edu.vn / admin123');
  console.log('📧 Leader: khoi.nm@fpt.edu.vn / leader123');
  console.log('📧 Student: anh.ph@fpt.edu.vn / user123');
}

module.exports = db;
