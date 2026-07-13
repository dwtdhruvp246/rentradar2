(function () {
  const STORAGE_KEY = 'mushavo_language';
  const DEFAULT_LANGUAGE = 'en';

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ms', label: 'Bahasa Melayu' },
    { code: 'zh', label: '中文' }
  ];

  const translations = {
    ms: {
      'Menu': 'Menu',
      'About': 'Tentang Kami',
      'Pricing': 'Harga',
      'Contact': 'Hubungi',
      'Client Area': 'Kawasan Pelanggan',
      'Contact Support': 'Hubungi Sokongan',
      'All rights reserved to Mushavo.': 'Semua hak terpelihara kepada Mushavo.',
      'Mushavo | Your property, handled simply.': 'Mushavo | Hartanah anda, diurus dengan mudah.',
      'About Mushavo | Vision, Mission, Goals': 'Tentang Mushavo | Visi, Misi, Matlamat',
      'Mushavo Pricing | Country Based Plans': 'Harga Mushavo | Pelan Mengikut Negara',
      'Contact Mushavo | Support and Sales': 'Hubungi Mushavo | Sokongan dan Jualan',
      'Your property, handled simply.': 'Hartanah anda, diurus dengan mudah.',

      'Property management software for landlords, IPMs, and PMCs': 'Perisian pengurusan hartanah untuk tuan rumah, IPM dan PMC',
      'One place for rent, leases, tenants, maintenance, and property teams.': 'Satu tempat untuk sewa, perjanjian, penyewa, penyelenggaraan dan pasukan hartanah.',
      'Mushavo helps property owners and managers run daily operations from a clear online workspace: properties, units, tenants, lease documents, payment proof, maintenance issues, staff permissions, and subscriptions.': 'Mushavo membantu pemilik dan pengurus hartanah menjalankan operasi harian melalui ruang kerja dalam talian yang jelas: hartanah, unit, penyewa, dokumen sewa, bukti bayaran, isu penyelenggaraan, kebenaran staf dan langganan.',
      'Mushavo is designed around the real workflow: create the property, assign the unit, link the tenant, store the lease, track rent, handle issues, and keep every action accountable.': 'Mushavo direka mengikut aliran kerja sebenar: cipta hartanah, tetapkan unit, pautkan penyewa, simpan perjanjian, jejak sewa, urus isu dan pastikan setiap tindakan boleh dipertanggungjawabkan.',
      'Landlords': 'Tuan Rumah',
      'Individual Portfolio Managers': 'Pengurus Portfolio Individu',
      'Property Management Companies': 'Syarikat Pengurusan Hartanah',
      'View Pricing': 'Lihat Harga',
      'Go to Client Area': 'Pergi ke Kawasan Pelanggan',
      'Live operating view': 'Paparan operasi langsung',
      'Mushavo Workspace': 'Ruang Kerja Mushavo',
      'Active': 'Aktif',
      'Properties': 'Hartanah',
      'Units': 'Unit',
      'Open issues': 'Isu terbuka',
      'Rent recorded': 'Sewa direkodkan',
      'This week': 'Minggu ini',
      '8 payments verified, 3 leases expiring soon, 4 maintenance tasks resolved.': '8 bayaran disahkan, 3 perjanjian hampir tamat, 4 tugas penyelenggaraan diselesaikan.',
      'What Mushavo is': 'Apa itu Mushavo',
      'A practical command centre for property operations.': 'Pusat kawalan praktikal untuk operasi hartanah.',
      'Instead of keeping records in chats, notebooks, spreadsheets, and separate folders, Mushavo keeps the important work connected to the right property, unit, tenant, landlord, staff member, and document.': 'Daripada menyimpan rekod dalam sembang, buku nota, hamparan dan folder berasingan, Mushavo menghubungkan kerja penting kepada hartanah, unit, penyewa, tuan rumah, staf dan dokumen yang betul.',
      'For landlords': 'Untuk tuan rumah',
      'Create properties and units, invite tenants, log rent, upload lease PDFs, handle maintenance, and control what staff can see or change.': 'Cipta hartanah dan unit, jemput penyewa, rekod sewa, muat naik PDF perjanjian, urus penyelenggaraan dan kawal apa yang boleh dilihat atau diubah oleh staf.',
      'For individual portfolio managers': 'Untuk pengurus portfolio individu',
      'Work with multiple landlords, request access with a landlord code, and manage only the accounts and properties you are approved for.': 'Bekerja dengan beberapa tuan rumah, minta akses menggunakan kod tuan rumah dan urus hanya akaun serta hartanah yang diluluskan.',
      'For property management companies': 'Untuk syarikat pengurusan hartanah',
      'Connect with landlords, assign company staff, manage permissions, and organize work across properties without mixing client records.': 'Berhubung dengan tuan rumah, tetapkan staf syarikat, urus kebenaran dan susun kerja merentas hartanah tanpa mencampurkan rekod pelanggan.',
      'What it manages': 'Apa yang diuruskan',
      'The everyday property work that usually gets scattered.': 'Kerja hartanah harian yang biasanya berselerak.',
      'Properties and units': 'Hartanah dan unit',
      'Track property details, unit status, occupancy, and vacancy in one place.': 'Jejaki butiran hartanah, status unit, penghunian dan kekosongan di satu tempat.',
      'Tenants and leases': 'Penyewa dan perjanjian sewa',
      'Keep tenant profiles, active leases, deposits, lease dates, and PDF agreements linked.': 'Pastikan profil penyewa, perjanjian aktif, deposit, tarikh sewa dan PDF perjanjian saling berkait.',
      'Payments and proof': 'Bayaran dan bukti',
      'Let tenants upload proof, then review, verify, reject, or log payments manually.': 'Benarkan penyewa memuat naik bukti, kemudian semak, sahkan, tolak atau rekod bayaran secara manual.',
      'Maintenance': 'Penyelenggaraan',
      'Create issues with photos, assign work, update progress, and keep resolution notes.': 'Cipta isu dengan gambar, tetapkan kerja, kemas kini kemajuan dan simpan nota penyelesaian.',
      'Staff permissions': 'Kebenaran staf',
      'Choose exactly who can view, add, edit, upload, approve, archive, or manage records.': 'Tentukan dengan tepat siapa yang boleh melihat, menambah, mengedit, memuat naik, meluluskan, mengarkibkan atau mengurus rekod.',
      'Subscriptions by market': 'Langganan mengikut pasaran',
      'Support country-based pricing, account limits, and renewals as Mushavo expands.': 'Sokong harga mengikut negara, had akaun dan pembaharuan apabila Mushavo berkembang.',
      'Why Mushavo': 'Kenapa Mushavo',
      'Less chasing. More control.': 'Kurang mengejar. Lebih kawalan.',
      'Property work becomes messy when rent records, lease PDFs, maintenance photos, approvals, and staff permissions live in different places. Mushavo brings them together without making the system feel heavy.': 'Kerja hartanah menjadi rumit apabila rekod sewa, PDF perjanjian, gambar penyelenggaraan, kelulusan dan kebenaran staf berada di tempat berbeza. Mushavo menyatukannya tanpa menjadikan sistem terasa berat.',
      'Lease and file storage': 'Storan perjanjian dan fail',
      'Upload agreements, payment proof, and maintenance photos securely.': 'Muat naik perjanjian, bukti bayaran dan gambar penyelenggaraan dengan selamat.',
      'Permission control': 'Kawalan kebenaran',
      'Give staff and managers only the access they need.': 'Berikan staf dan pengurus hanya akses yang diperlukan.',
      'Country pricing': 'Harga mengikut negara',
      'Show plans that match the market where each account operates.': 'Paparkan pelan yang sesuai dengan pasaran tempat setiap akaun beroperasi.',
      'Clear operations': 'Operasi yang jelas',
      'Track rent, maintenance, tenants, units, and subscriptions from one place.': 'Jejaki sewa, penyelenggaraan, penyewa, unit dan langganan dari satu tempat.',
      'Create the account': 'Cipta akaun',
      'Admin creates landlords, IPMs, PMCs, and country-based subscriptions.': 'Admin mencipta tuan rumah, IPM, PMC dan langganan mengikut negara.',
      'Add the portfolio': 'Tambah portfolio',
      'Landlords add properties and units, then link tenants and leases.': 'Tuan rumah menambah hartanah dan unit, kemudian menghubungkan penyewa dan perjanjian.',
      'Control access': 'Kawal akses',
      'Permissions decide what each staff member, IPM, or PMC can do.': 'Kebenaran menentukan perkara yang boleh dilakukan oleh setiap staf, IPM atau PMC.',
      'Run daily work': 'Jalankan kerja harian',
      'Payments, maintenance, documents, reminders, and records stay connected.': 'Bayaran, penyelenggaraan, dokumen, peringatan dan rekod kekal terhubung.',
      'Ready to run property work with less stress?': 'Bersedia mengurus kerja hartanah dengan kurang tekanan?',
      'Explore the plans, then sign into your client area when your account is created.': 'Terokai pelan, kemudian log masuk ke kawasan pelanggan apabila akaun anda dibuat.',
      'See Plans': 'Lihat Pelan',

      'About Mushavo': 'Tentang Mushavo',
      'Property management should feel calm, clear, and under control.': 'Pengurusan hartanah sepatutnya terasa tenang, jelas dan terkawal.',
      'Mushavo is a property operations platform for landlords, individual portfolio managers, and property management companies. It brings properties, units, tenants, leases, payments, proof files, maintenance, staff permissions, and subscriptions into one accountable workspace.': 'Mushavo ialah platform operasi hartanah untuk tuan rumah, pengurus portfolio individu dan syarikat pengurusan hartanah. Ia menggabungkan hartanah, unit, penyewa, perjanjian, bayaran, fail bukti, penyelenggaraan, kebenaran staf dan langganan dalam satu ruang kerja yang bertanggungjawab.',
      'Clear record for each property, unit, tenant, and lease.': 'Rekod jelas untuk setiap hartanah, unit, penyewa dan perjanjian.',
      'Controlled access for staff, IPMs, PMCs, and tenants.': 'Akses terkawal untuk staf, IPM, PMC dan penyewa.',
      'Safer documents, payments, maintenance history, and audit trails.': 'Dokumen, bayaran, sejarah penyelenggaraan dan jejak audit yang lebih selamat.',
      'Vision': 'Visi',
      'Make property operations simpler across growing markets.': 'Memudahkan operasi hartanah di pasaran yang sedang berkembang.',
      'We want Mushavo to become a trusted operating system for property work in markets like Zimbabwe, Malaysia, and other countries where owners and managers need practical tools that fit local pricing and workflows.': 'Kami mahu Mushavo menjadi sistem operasi yang dipercayai untuk kerja hartanah di pasaran seperti Zimbabwe, Malaysia dan negara lain, di mana pemilik dan pengurus memerlukan alat praktikal yang sesuai dengan harga serta aliran kerja tempatan.',
      'Mission': 'Misi',
      'Put every important property record in one clean place.': 'Letakkan setiap rekod hartanah penting di satu tempat yang kemas.',
      'Mushavo helps teams manage rent, tenants, leases, maintenance, documents, staff permissions, and subscriptions with clear accountability, so records do not disappear when people move, change teams, or change landlords.': 'Mushavo membantu pasukan mengurus sewa, penyewa, perjanjian, penyelenggaraan, dokumen, kebenaran staf dan langganan dengan akauntabiliti yang jelas, supaya rekod tidak hilang apabila orang berpindah, bertukar pasukan atau bertukar tuan rumah.',
      'Goals': 'Matlamat',
      'Build trust through reliable records and better workflows.': 'Membina kepercayaan melalui rekod yang boleh dipercayai dan aliran kerja yang lebih baik.',
      'The goal is to reduce disputes, missed follow-ups, lost files, and unclear responsibility between landlords, tenants, staff, IPMs, and PMCs.': 'Matlamatnya adalah untuk mengurangkan pertikaian, susulan yang terlepas, fail yang hilang dan tanggungjawab yang tidak jelas antara tuan rumah, penyewa, staf, IPM dan PMC.',
      'Who we serve': 'Siapa yang kami bantu',
      'Built for the different people involved in property work.': 'Dibina untuk pelbagai pihak yang terlibat dalam kerja hartanah.',
      'Individual portfolio managers': 'Pengurus portfolio individu',
      'Own and manage properties, tenants, leases, payments, staff, and maintenance.': 'Memiliki dan mengurus hartanah, penyewa, perjanjian, bayaran, staf dan penyelenggaraan.',
      'Work for multiple landlords with approved access and clear limits.': 'Bekerja untuk beberapa tuan rumah dengan akses yang diluluskan dan had yang jelas.',
      'Property management companies': 'Syarikat pengurusan hartanah',
      'Manage landlord relationships, company staff, permissions, and assigned portfolios.': 'Mengurus hubungan tuan rumah, staf syarikat, kebenaran dan portfolio yang diberikan.',
      'Tenants and staff': 'Penyewa dan staf',
      'Submit payments, report issues, upload files, and only see what they are allowed to access.': 'Menghantar bayaran, melaporkan isu, memuat naik fail dan hanya melihat perkara yang dibenarkan.',
      'What guides us': 'Prinsip kami',
      'Useful first. Beautiful because it is useful.': 'Berguna dahulu. Cantik kerana ia berguna.',
      'Mushavo should feel premium, but the design has to support the work. Every screen should make the next action obvious, protect records, and keep teams aligned.': 'Mushavo perlu terasa premium, tetapi reka bentuknya mesti menyokong kerja sebenar. Setiap skrin perlu menjadikan tindakan seterusnya jelas, melindungi rekod dan memastikan pasukan selaras.',
      'Clarity': 'Kejelasan',
      'Important information should be easy to find and easy to understand.': 'Maklumat penting perlu mudah dicari dan mudah difahami.',
      'Control': 'Kawalan',
      'Owners decide who can view, edit, upload, approve, and manage.': 'Pemilik menentukan siapa yang boleh melihat, mengedit, memuat naik, meluluskan dan mengurus.',
      'Trust': 'Kepercayaan',
      'Records should remain available even when accounts or relationships change.': 'Rekod perlu kekal tersedia walaupun akaun atau hubungan berubah.',
      'Scale': 'Skala',
      'Country pricing, subscriptions, IPMs, PMCs, and staff permissions are designed for growth.': 'Harga mengikut negara, langganan, IPM, PMC dan kebenaran staf direka untuk pertumbuhan.',
      'Our product promise': 'Janji produk kami',
      'Records should stay reliable even when people change.': 'Rekod harus kekal boleh dipercayai walaupun orang berubah.',
      'When a tenant moves, a landlord changes manager, staff are removed, or a subscription pauses, the business history should remain understandable. Mushavo is being designed around long-term records, controlled deletion, clear archiving, and permission-based access.': 'Apabila penyewa berpindah, tuan rumah menukar pengurus, staf dibuang atau langganan dijeda, sejarah perniagaan masih perlu mudah difahami. Mushavo direka berdasarkan rekod jangka panjang, pemadaman terkawal, pengarkiban jelas dan akses berdasarkan kebenaran.',

      'Plans that match your country, portfolio size, and account type.': 'Pelan yang sepadan dengan negara, saiz portfolio dan jenis akaun anda.',
      'Choose your country to see local pricing. Mushavo can price each market separately, so Zimbabwe, Malaysia, and future countries can have plans that make sense locally.': 'Pilih negara anda untuk melihat harga tempatan. Mushavo boleh menetapkan harga setiap pasaran secara berasingan supaya Zimbabwe, Malaysia dan negara akan datang mempunyai pelan yang sesuai secara tempatan.',
      'Country': 'Negara',
      'Billing': 'Bil',
      'Monthly': 'Bulanan',
      'Yearly': 'Tahunan',
      'IPM': 'IPM',
      'PMC': 'PMC',
      'Popular': 'Popular',
      'Free': 'Percuma',
      'Starter': 'Permulaan',
      'Growth': 'Pertumbuhan',
      'Portfolio': 'Portfolio',
      'Pro': 'Pro',
      'Business': 'Perniagaan',
      'Custom': 'Tersuai',
      'Sign up for free': 'Daftar percuma',
      'Enquire': 'Bertanya',
      'Choose country': 'Pilih negara',
      'Each country can have its own currency, pricing level, and add-on prices.': 'Setiap negara boleh mempunyai mata wang, tahap harga dan harga tambahan sendiri.',
      'Choose account type': 'Pilih jenis akaun',
      'Landlords, individual portfolio managers, and property management companies have different limits.': 'Tuan rumah, pengurus portfolio individu dan syarikat pengurusan hartanah mempunyai had yang berbeza.',
      'Match the portfolio': 'Padankan portfolio',
      'Plans are mainly based on properties, units, landlord connections, staff, and storage needs.': 'Pelan terutama berdasarkan hartanah, unit, sambungan tuan rumah, staf dan keperluan storan.',
      'Add capacity later': 'Tambah kapasiti kemudian',
      'Customers can add units, properties, staff, storage, or setup support as they grow.': 'Pelanggan boleh menambah unit, hartanah, staf, storan atau sokongan persediaan apabila berkembang.',
      'Add-ons': 'Tambahan',
      'Use add-ons when a customer needs more capacity without moving to a higher plan. Deposits are not treated as revenue in Mushavo reporting because they are normally held for return or applied according to the lease.': 'Gunakan tambahan apabila pelanggan memerlukan lebih kapasiti tanpa berpindah ke pelan lebih tinggi. Deposit tidak dianggap sebagai hasil dalam laporan Mushavo kerana lazimnya ia dipegang untuk dipulangkan atau digunakan mengikut perjanjian sewa.',
      'Need a larger setup?': 'Perlukan persediaan yang lebih besar?',
      'For large property groups, custom country rollouts, or heavy file storage, contact Mushavo for a custom plan.': 'Untuk kumpulan hartanah besar, pelaksanaan negara tersuai atau storan fail yang tinggi, hubungi Mushavo untuk pelan tersuai.',
      'Contact Sales': 'Hubungi Jualan',

      'Talk to Mushavo.': 'Berbual dengan Mushavo.',
      'Use this page for support, subscriptions, setup help, pricing questions, country expansion, or account enquiries. Your message is sent straight to the Mushavo admin area.': 'Gunakan halaman ini untuk sokongan, langganan, bantuan persediaan, soalan harga, peluasan negara atau pertanyaan akaun. Mesej anda dihantar terus ke kawasan admin Mushavo.',
      'Support': 'Sokongan',
      'Account and product help': 'Bantuan akaun dan produk',
      'For login access, subscription renewal, setup, and product support.': 'Untuk akses log masuk, pembaharuan langganan, persediaan dan sokongan produk.',
      'Sales': 'Jualan',
      'Pricing and onboarding': 'Harga dan onboarding',
      'For landlords, IPMs, PMCs, country expansion, and custom plans.': 'Untuk tuan rumah, IPM, PMC, peluasan negara dan pelan tersuai.',
      'Enquiry form': 'Borang pertanyaan',
      'Choose any country, even if Mushavo is not operating there yet. This helps you see where demand is coming from.': 'Pilih mana-mana negara, walaupun Mushavo belum beroperasi di sana. Ini membantu kami melihat dari mana permintaan datang.',
      'Full name': 'Nama penuh',
      'Email': 'E-mel',
      'Enquiry type': 'Jenis pertanyaan',
      'Message': 'Mesej',
      'Submit Enquiry': 'Hantar Pertanyaan',
      'Copy Message': 'Salin Mesej',
      'Submitting...': 'Menghantar...',
      'Submitting your enquiry...': 'Pertanyaan anda sedang dihantar...',
      'Enquiry submitted. The Mushavo team will review it from the admin area.': 'Pertanyaan dihantar. Pasukan Mushavo akan menyemaknya dari kawasan admin.',

      'Loading Mushavo...': 'Memuatkan Mushavo...',
      'Sign in to Mushavo': 'Log masuk ke Mushavo',
      'Create free landlord account': 'Cipta akaun tuan rumah percuma',
      'Staff signup': 'Pendaftaran staf',
      'Access your Mushavo account or create a free landlord account.': 'Akses akaun Mushavo anda atau cipta akaun tuan rumah percuma.',
      'For landlords only. Start with 1 property, 1 unit, finance tracking, and 1 IPM or PMC connection.': 'Untuk tuan rumah sahaja. Bermula dengan 1 hartanah, 1 unit, penjejakan kewangan dan 1 sambungan IPM atau PMC.',
      'Create a staff account and request access with a landlord code.': 'Cipta akaun staf dan minta akses menggunakan kod tuan rumah.',
      'Password': 'Kata laluan',
      'Confirm': 'Sahkan',
      'Confirm password': 'Sahkan kata laluan',
      'Sign in': 'Log masuk',
      'Signing in...': 'Sedang log masuk...',
      'Create staff account': 'Cipta akaun staf',
      'Create account': 'Cipta akaun',
      'Creating...': 'Mencipta...',
      'Creating account...': 'Akaun sedang dicipta...',
      'Back to sign in': 'Kembali ke log masuk',
      'Logout': 'Log keluar',
      'Refresh': 'Segar semula',
      'Dashboard': 'Papan Pemuka',
      'Tenants': 'Penyewa',
      'Leases': 'Perjanjian',
      'Payments': 'Bayaran',
      'Finance': 'Kewangan',
      'Settings': 'Tetapan',
      'Notifications': 'Notifikasi',
      'My Account': 'Akaun Saya',
      'Staff': 'Staf',
      'Admin Staff': 'Staf Admin',
      'Landlord Management': 'Pengurusan Tuan Rumah',
      'Tenant Management': 'Pengurusan Penyewa',
      'IPM Management': 'Pengurusan IPM',
      'Property Management Companies': 'Syarikat Pengurusan Hartanah',
      'Connected Landlords': 'Tuan Rumah Terhubung',
      'Home': 'Laman Utama',
      'Add Property': 'Tambah Hartanah',
      'Add Landlord': 'Tambah Tuan Rumah',
      'Add Country': 'Tambah Negara',
      'Search': 'Cari',
      'View': 'Lihat',
      'Edit': 'Edit',
      'Delete': 'Padam',
      'Archive': 'Arkib',
      'Save': 'Simpan',
      'Cancel': 'Batal',
      'Approve': 'Luluskan',
      'Reject': 'Tolak',
      'Pending': 'Menunggu',
      'Accepted': 'Diterima',
      'Approved': 'Diluluskan',
      'Suspended': 'Digantung',
      'Trial': 'Percubaan',
      'Archived': 'Diarkibkan',
      'Name': 'Nama',
      'Phone': 'Telefon',
      'Status': 'Status',
      'Actions': 'Tindakan',
      'Submitted': 'Dihantar',
      'Open': 'Terbuka',
      'In Progress': 'Sedang Berjalan',
      'Resolved': 'Selesai'
    },
    zh: {
      'Menu': '菜单',
      'About': '关于我们',
      'Pricing': '价格',
      'Contact': '联系我们',
      'Client Area': '客户中心',
      'Contact Support': '联系支持',
      'All rights reserved to Mushavo.': 'Mushavo 保留所有权利。',
      'Mushavo | Your property, handled simply.': 'Mushavo | 让物业管理更简单。',
      'About Mushavo | Vision, Mission, Goals': '关于 Mushavo | 愿景、使命与目标',
      'Mushavo Pricing | Country Based Plans': 'Mushavo 价格 | 按国家制定的方案',
      'Contact Mushavo | Support and Sales': '联系 Mushavo | 支持与销售',
      'Your property, handled simply.': '让物业管理更简单。',

      'Property management software for landlords, IPMs, and PMCs': '面向房东、IPM 和 PMC 的物业管理软件',
      'One place for rent, leases, tenants, maintenance, and property teams.': '一个平台管理租金、租约、租户、维修和物业团队。',
      'Mushavo helps property owners and managers run daily operations from a clear online workspace: properties, units, tenants, lease documents, payment proof, maintenance issues, staff permissions, and subscriptions.': 'Mushavo 帮助业主和管理者在清晰的线上工作区处理日常运营：物业、单位、租户、租约文件、付款凭证、维修事项、员工权限和订阅。',
      'Mushavo is designed around the real workflow: create the property, assign the unit, link the tenant, store the lease, track rent, handle issues, and keep every action accountable.': 'Mushavo 围绕真实工作流程设计：创建物业，分配单位，关联租户，保存租约，跟踪租金，处理问题，并让每个操作都有责任记录。',
      'Landlords': '房东',
      'Individual Portfolio Managers': '个人物业组合经理',
      'Property Management Companies': '物业管理公司',
      'View Pricing': '查看价格',
      'Go to Client Area': '进入客户中心',
      'Live operating view': '实时运营视图',
      'Mushavo Workspace': 'Mushavo 工作区',
      'Active': '活跃',
      'Properties': '物业',
      'Units': '单位',
      'Open issues': '未处理事项',
      'Rent recorded': '已记录租金',
      'This week': '本周',
      '8 payments verified, 3 leases expiring soon, 4 maintenance tasks resolved.': '8 笔付款已核实，3 份租约即将到期，4 个维修任务已解决。',
      'What Mushavo is': 'Mushavo 是什么',
      'A practical command centre for property operations.': '一个实用的物业运营指挥中心。',
      'Instead of keeping records in chats, notebooks, spreadsheets, and separate folders, Mushavo keeps the important work connected to the right property, unit, tenant, landlord, staff member, and document.': '不再把记录分散在聊天、笔记、表格和文件夹中，Mushavo 将重要工作连接到正确的物业、单位、租户、房东、员工和文件。',
      'For landlords': '适合房东',
      'Create properties and units, invite tenants, log rent, upload lease PDFs, handle maintenance, and control what staff can see or change.': '创建物业和单位，邀请租户，记录租金，上传租约 PDF，处理维修，并控制员工可以查看或修改的内容。',
      'For individual portfolio managers': '适合个人物业组合经理',
      'Work with multiple landlords, request access with a landlord code, and manage only the accounts and properties you are approved for.': '可与多位房东合作，通过房东代码申请访问，并只管理已获批准的账户和物业。',
      'For property management companies': '适合物业管理公司',
      'Connect with landlords, assign company staff, manage permissions, and organize work across properties without mixing client records.': '与房东连接，分配公司员工，管理权限，并在不混淆客户记录的情况下组织各物业工作。',
      'What it manages': '它能管理什么',
      'The everyday property work that usually gets scattered.': '那些平时容易分散的日常物业工作。',
      'Properties and units': '物业和单位',
      'Track property details, unit status, occupancy, and vacancy in one place.': '在一个地方跟踪物业资料、单位状态、入住和空置情况。',
      'Tenants and leases': '租户和租约',
      'Keep tenant profiles, active leases, deposits, lease dates, and PDF agreements linked.': '将租户资料、有效租约、押金、租约日期和 PDF 协议保持关联。',
      'Payments and proof': '付款和凭证',
      'Let tenants upload proof, then review, verify, reject, or log payments manually.': '让租户上传凭证，然后审核、核实、拒绝或手动记录付款。',
      'Maintenance': '维修',
      'Create issues with photos, assign work, update progress, and keep resolution notes.': '创建带照片的问题，分配工作，更新进度，并保留解决记录。',
      'Staff permissions': '员工权限',
      'Choose exactly who can view, add, edit, upload, approve, archive, or manage records.': '精确控制谁可以查看、新增、编辑、上传、批准、归档或管理记录。',
      'Subscriptions by market': '按市场订阅',
      'Support country-based pricing, account limits, and renewals as Mushavo expands.': '随着 Mushavo 扩展，支持按国家定价、账户限制和续订。',
      'Why Mushavo': '为什么选择 Mushavo',
      'Less chasing. More control.': '少追问，多掌控。',
      'Property work becomes messy when rent records, lease PDFs, maintenance photos, approvals, and staff permissions live in different places. Mushavo brings them together without making the system feel heavy.': '当租金记录、租约 PDF、维修照片、审批和员工权限分散在不同地方时，物业工作会变得混乱。Mushavo 将它们整合在一起，同时保持系统轻便。',
      'Lease and file storage': '租约和文件存储',
      'Upload agreements, payment proof, and maintenance photos securely.': '安全上传协议、付款凭证和维修照片。',
      'Permission control': '权限控制',
      'Give staff and managers only the access they need.': '只给员工和管理者所需的访问权限。',
      'Country pricing': '按国家定价',
      'Show plans that match the market where each account operates.': '显示符合每个账户所在市场的方案。',
      'Clear operations': '清晰运营',
      'Track rent, maintenance, tenants, units, and subscriptions from one place.': '从一个地方跟踪租金、维修、租户、单位和订阅。',
      'Create the account': '创建账户',
      'Admin creates landlords, IPMs, PMCs, and country-based subscriptions.': '管理员创建房东、IPM、PMC 和按国家设置的订阅。',
      'Add the portfolio': '添加组合',
      'Landlords add properties and units, then link tenants and leases.': '房东添加物业和单位，然后关联租户和租约。',
      'Control access': '控制访问',
      'Permissions decide what each staff member, IPM, or PMC can do.': '权限决定每位员工、IPM 或 PMC 可以执行的操作。',
      'Run daily work': '处理日常工作',
      'Payments, maintenance, documents, reminders, and records stay connected.': '付款、维修、文件、提醒和记录保持连接。',
      'Ready to run property work with less stress?': '准备好更轻松地管理物业工作了吗？',
      'Explore the plans, then sign into your client area when your account is created.': '查看方案，账户创建后即可登录客户中心。',
      'See Plans': '查看方案',

      'About Mushavo': '关于 Mushavo',
      'Property management should feel calm, clear, and under control.': '物业管理应该清晰、平稳并且可控。',
      'Mushavo is a property operations platform for landlords, individual portfolio managers, and property management companies. It brings properties, units, tenants, leases, payments, proof files, maintenance, staff permissions, and subscriptions into one accountable workspace.': 'Mushavo 是面向房东、个人物业组合经理和物业管理公司的物业运营平台。它把物业、单位、租户、租约、付款、凭证文件、维修、员工权限和订阅集中到一个可追踪的工作区。',
      'Clear record for each property, unit, tenant, and lease.': '每个物业、单位、租户和租约都有清晰记录。',
      'Controlled access for staff, IPMs, PMCs, and tenants.': '为员工、IPM、PMC 和租户提供受控访问。',
      'Safer documents, payments, maintenance history, and audit trails.': '更安全的文件、付款、维修历史和审计记录。',
      'Vision': '愿景',
      'Make property operations simpler across growing markets.': '让成长中市场的物业运营更简单。',
      'We want Mushavo to become a trusted operating system for property work in markets like Zimbabwe, Malaysia, and other countries where owners and managers need practical tools that fit local pricing and workflows.': '我们希望 Mushavo 成为津巴布韦、马来西亚以及其他市场中值得信赖的物业工作操作系统，为业主和管理者提供符合本地价格与流程的实用工具。',
      'Mission': '使命',
      'Put every important property record in one clean place.': '把每一项重要物业记录放在一个清晰的位置。',
      'Mushavo helps teams manage rent, tenants, leases, maintenance, documents, staff permissions, and subscriptions with clear accountability, so records do not disappear when people move, change teams, or change landlords.': 'Mushavo 帮助团队以清晰的责任机制管理租金、租户、租约、维修、文件、员工权限和订阅，确保人员搬迁、团队变更或房东变更时记录不会消失。',
      'Goals': '目标',
      'Build trust through reliable records and better workflows.': '通过可靠记录和更好的流程建立信任。',
      'The goal is to reduce disputes, missed follow-ups, lost files, and unclear responsibility between landlords, tenants, staff, IPMs, and PMCs.': '目标是减少房东、租户、员工、IPM 和 PMC 之间的纠纷、遗漏跟进、文件丢失和责任不清。',
      'Who we serve': '我们服务谁',
      'Built for the different people involved in property work.': '为物业工作中的不同角色而设计。',
      'Individual portfolio managers': '个人物业组合经理',
      'Own and manage properties, tenants, leases, payments, staff, and maintenance.': '拥有并管理物业、租户、租约、付款、员工和维修。',
      'Work for multiple landlords with approved access and clear limits.': '在获得批准且限制清晰的情况下，为多位房东工作。',
      'Property management companies': '物业管理公司',
      'Manage landlord relationships, company staff, permissions, and assigned portfolios.': '管理房东关系、公司员工、权限和分配的物业组合。',
      'Tenants and staff': '租户和员工',
      'Submit payments, report issues, upload files, and only see what they are allowed to access.': '提交付款、报告问题、上传文件，并只查看被允许访问的内容。',
      'What guides us': '我们的原则',
      'Useful first. Beautiful because it is useful.': '先实用，再因实用而美观。',
      'Mushavo should feel premium, but the design has to support the work. Every screen should make the next action obvious, protect records, and keep teams aligned.': 'Mushavo 应该有高级感，但设计必须服务于实际工作。每个页面都应让下一步操作清晰、保护记录，并让团队保持一致。',
      'Clarity': '清晰',
      'Important information should be easy to find and easy to understand.': '重要信息应该容易查找、容易理解。',
      'Control': '控制',
      'Owners decide who can view, edit, upload, approve, and manage.': '业主决定谁可以查看、编辑、上传、批准和管理。',
      'Trust': '信任',
      'Records should remain available even when accounts or relationships change.': '即使账户或关系发生变化，记录也应保持可用。',
      'Scale': '扩展',
      'Country pricing, subscriptions, IPMs, PMCs, and staff permissions are designed for growth.': '按国家定价、订阅、IPM、PMC 和员工权限都为增长而设计。',
      'Our product promise': '我们的产品承诺',
      'Records should stay reliable even when people change.': '即使人员变化，记录也应保持可靠。',
      'When a tenant moves, a landlord changes manager, staff are removed, or a subscription pauses, the business history should remain understandable. Mushavo is being designed around long-term records, controlled deletion, clear archiving, and permission-based access.': '当租户搬走、房东更换管理者、员工被移除或订阅暂停时，业务历史仍应清晰可理解。Mushavo 围绕长期记录、受控删除、清晰归档和基于权限的访问而设计。',

      'Plans that match your country, portfolio size, and account type.': '适合您的国家、组合规模和账户类型的方案。',
      'Choose your country to see local pricing. Mushavo can price each market separately, so Zimbabwe, Malaysia, and future countries can have plans that make sense locally.': '选择您的国家以查看本地价格。Mushavo 可以为每个市场单独定价，让津巴布韦、马来西亚和未来国家都有适合本地的方案。',
      'Country': '国家',
      'Billing': '计费',
      'Monthly': '月付',
      'Yearly': '年付',
      'IPM': 'IPM',
      'PMC': 'PMC',
      'Popular': '热门',
      'Free': '免费',
      'Starter': '入门',
      'Growth': '成长',
      'Portfolio': '组合',
      'Pro': '专业',
      'Business': '商业',
      'Custom': '定制',
      'Sign up for free': '免费注册',
      'Enquire': '咨询',
      'Choose country': '选择国家',
      'Each country can have its own currency, pricing level, and add-on prices.': '每个国家都可以拥有自己的货币、价格水平和附加项目价格。',
      'Choose account type': '选择账户类型',
      'Landlords, individual portfolio managers, and property management companies have different limits.': '房东、个人物业组合经理和物业管理公司有不同的限制。',
      'Match the portfolio': '匹配组合',
      'Plans are mainly based on properties, units, landlord connections, staff, and storage needs.': '方案主要基于物业、单位、房东连接、员工和存储需求。',
      'Add capacity later': '之后增加容量',
      'Customers can add units, properties, staff, storage, or setup support as they grow.': '客户可以随着增长增加单位、物业、员工、存储或设置支持。',
      'Add-ons': '附加项目',
      'Use add-ons when a customer needs more capacity without moving to a higher plan. Deposits are not treated as revenue in Mushavo reporting because they are normally held for return or applied according to the lease.': '当客户需要更多容量但不想升级到更高方案时，可以使用附加项目。押金在 Mushavo 报表中不计为收入，因为通常会被保留用于退还或根据租约处理。',
      'Need a larger setup?': '需要更大的配置？',
      'For large property groups, custom country rollouts, or heavy file storage, contact Mushavo for a custom plan.': '对于大型物业集团、定制国家部署或大量文件存储，请联系 Mushavo 获取定制方案。',
      'Contact Sales': '联系销售',

      'Talk to Mushavo.': '与 Mushavo 联系。',
      'Use this page for support, subscriptions, setup help, pricing questions, country expansion, or account enquiries. Your message is sent straight to the Mushavo admin area.': '您可以在此页面提交支持、订阅、设置帮助、价格问题、国家扩展或账户咨询。您的消息会直接发送到 Mushavo 管理后台。',
      'Support': '支持',
      'Account and product help': '账户和产品帮助',
      'For login access, subscription renewal, setup, and product support.': '用于登录访问、订阅续费、设置和产品支持。',
      'Sales': '销售',
      'Pricing and onboarding': '价格和入门指导',
      'For landlords, IPMs, PMCs, country expansion, and custom plans.': '适用于房东、IPM、PMC、国家扩展和定制方案。',
      'Enquiry form': '咨询表格',
      'Choose any country, even if Mushavo is not operating there yet. This helps you see where demand is coming from.': '请选择任何国家，即使 Mushavo 尚未在那里运营。这有助于我们了解需求来自哪里。',
      'Full name': '全名',
      'Email': '电子邮箱',
      'Enquiry type': '咨询类型',
      'Message': '消息',
      'Submit Enquiry': '提交咨询',
      'Copy Message': '复制消息',
      'Submitting...': '正在提交...',
      'Submitting your enquiry...': '正在提交您的咨询...',
      'Enquiry submitted. The Mushavo team will review it from the admin area.': '咨询已提交。Mushavo 团队会在管理后台查看。',

      'Loading Mushavo...': '正在加载 Mushavo...',
      'Sign in to Mushavo': '登录 Mushavo',
      'Create free landlord account': '创建免费房东账户',
      'Staff signup': '员工注册',
      'Access your Mushavo account or create a free landlord account.': '访问您的 Mushavo 账户，或创建免费的房东账户。',
      'For landlords only. Start with 1 property, 1 unit, finance tracking, and 1 IPM or PMC connection.': '仅限房东。包含 1 个物业、1 个单位、财务跟踪，以及 1 个 IPM 或 PMC 连接。',
      'Create a staff account and request access with a landlord code.': '创建员工账户，并使用房东代码申请访问。',
      'Password': '密码',
      'Confirm': '确认',
      'Confirm password': '确认密码',
      'Sign in': '登录',
      'Signing in...': '正在登录...',
      'Create staff account': '创建员工账户',
      'Create account': '创建账户',
      'Creating...': '正在创建...',
      'Creating account...': '正在创建账户...',
      'Back to sign in': '返回登录',
      'Logout': '退出登录',
      'Refresh': '刷新',
      'Dashboard': '仪表板',
      'Tenants': '租户',
      'Leases': '租约',
      'Payments': '付款',
      'Finance': '财务',
      'Settings': '设置',
      'Notifications': '通知',
      'My Account': '我的账户',
      'Staff': '员工',
      'Admin Staff': '管理员工',
      'Landlord Management': '房东管理',
      'Tenant Management': '租户管理',
      'IPM Management': 'IPM 管理',
      'Property Management Companies': '物业管理公司',
      'Connected Landlords': '已连接房东',
      'Home': '首页',
      'Add Property': '添加物业',
      'Add Landlord': '添加房东',
      'Add Country': '添加国家',
      'Search': '搜索',
      'View': '查看',
      'Edit': '编辑',
      'Delete': '删除',
      'Archive': '归档',
      'Save': '保存',
      'Cancel': '取消',
      'Approve': '批准',
      'Reject': '拒绝',
      'Pending': '待处理',
      'Accepted': '已接受',
      'Approved': '已批准',
      'Suspended': '已暂停',
      'Trial': '试用',
      'Archived': '已归档',
      'Name': '姓名',
      'Phone': '电话',
      'Status': '状态',
      'Actions': '操作',
      'Submitted': '已提交',
      'Open': '打开',
      'In Progress': '进行中',
      'Resolved': '已解决'
    }
  };

  const textOriginals = new WeakMap();
  const attrOriginals = new WeakMap();
  let observer = null;
  let applying = false;
  let currentLanguage = getLanguage();

  function getLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return languages.some(language => language.code === saved) ? saved : DEFAULT_LANGUAGE;
  }

  function translate(text, language = getLanguage()) {
    if (language === DEFAULT_LANGUAGE) return text;
    return translations[language]?.[text] || text;
  }

  function setDocumentLanguage(language) {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
    document.title = translate(attrOriginals.get(document)?.title || document.title, language);
  }

  function textNodeAllowed(node) {
    const parent = node.parentElement;
    if (!parent) return false;
    return !parent.closest('script, style, textarea, input, select, option, code, pre, [data-i18n-ignore]');
  }

  function translateTextNode(node, language, allowOriginalUpdate = true) {
    if (!textNodeAllowed(node)) return;
    const current = node.nodeValue || '';
    const trimmed = current.trim();
    if (!trimmed) return;
    if (!textOriginals.has(node)) textOriginals.set(node, trimmed);
    let original = textOriginals.get(node);
    const expectedCurrent = translate(original, language);
    if (allowOriginalUpdate && trimmed !== original && trimmed !== expectedCurrent) {
      original = trimmed;
      textOriginals.set(node, original);
    }
    const next = translate(original, language);
    const leading = current.match(/^\s*/)?.[0] || '';
    const trailing = current.match(/\s*$/)?.[0] || '';
    const value = `${leading}${next}${trailing}`;
    if (node.nodeValue !== value) node.nodeValue = value;
  }

  function translateAttributes(root, language) {
    const elements = [root, ...root.querySelectorAll?.('[placeholder], [aria-label], [title]') || []];
    elements.forEach(element => {
      if (!(element instanceof Element) || element.closest('script, style, [data-i18n-ignore]')) return;
      ['placeholder', 'aria-label', 'title'].forEach(attribute => {
        if (!element.hasAttribute(attribute)) return;
        if (!attrOriginals.has(element)) attrOriginals.set(element, {});
        const originals = attrOriginals.get(element);
        if (!originals[attribute]) originals[attribute] = element.getAttribute(attribute);
        const next = translate(originals[attribute], language);
        if (element.getAttribute(attribute) !== next) element.setAttribute(attribute, next);
      });
    });
  }

  function walkText(root, language, allowOriginalUpdate = true) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, language, allowOriginalUpdate);
      return;
    }
    if (!(root instanceof Element || root instanceof DocumentFragment || root instanceof Document)) return;
    translateAttributes(root, language);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      translateTextNode(node, language, allowOriginalUpdate);
      node = walker.nextNode();
    }
  }

  function createLanguageControl() {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-mushavo-language-control', 'true');
    wrapper.className = 'mushavo-language-control flex items-center gap-2';
    const select = document.createElement('select');
    select.className = 'h-10 rounded-2xl border border-emerald-200 bg-white/80 px-3 text-xs font-bold text-slate-700 shadow-sm outline-none backdrop-blur-xl transition focus:border-emerald-500';
    select.setAttribute('aria-label', 'Language');
    languages.forEach(language => {
      const option = document.createElement('option');
      option.value = language.code;
      option.textContent = language.label;
      select.appendChild(option);
    });
    select.value = getLanguage();
    select.addEventListener('change', () => {
      localStorage.setItem(STORAGE_KEY, select.value);
      applyTranslations();
      syncControls();
    });
    wrapper.appendChild(select);
    return wrapper;
  }

  function syncControls() {
    document.querySelectorAll('[data-mushavo-language-control] select').forEach(select => {
      select.value = getLanguage();
    });
  }

  function mountLanguageControls() {
    document.querySelectorAll('header').forEach(header => {
      if (header.querySelector('[data-mushavo-language-control]')) return;
      const row = header.querySelector(':scope > div') || header;
      const nav = row.querySelector('nav');
      const menuButton = row.querySelector('#menuButton');
      const control = createLanguageControl();
      control.classList.add('ml-auto', 'shrink-0');
      row.insertBefore(control, nav || menuButton || row.lastElementChild);
    });

    if (!document.querySelector('header') && !document.querySelector('[data-mushavo-language-control]')) {
      const section = document.querySelector('main section');
      if (section) {
        const holder = document.createElement('div');
        holder.className = 'mb-4 flex justify-end';
        holder.setAttribute('data-mushavo-language-control-holder', 'true');
        holder.appendChild(createLanguageControl());
        section.insertBefore(holder, section.firstChild);
      }
    }
  }

  function applyTranslations(root = document.body) {
    if (!root || applying) return;
    applying = true;
    const language = getLanguage();
    const languageChanged = language !== currentLanguage;
    currentLanguage = language;
    setDocumentLanguage(language);
    mountLanguageControls();
    walkText(root, language, !languageChanged);
    syncControls();
    applying = false;
  }

  function observe() {
    if (observer) return;
    observer = new MutationObserver(mutations => {
      if (applying) return;
      const language = getLanguage();
      let needsMount = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'characterData') {
          walkText(mutation.target, language, true);
          return;
        }
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE && node.matches?.('header')) needsMount = true;
          walkText(node, language);
        });
      });
      if (needsMount || !document.querySelector('[data-mushavo-language-control]')) mountLanguageControls();
      syncControls();
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
  }

  function init() {
    if (!attrOriginals.has(document)) attrOriginals.set(document, { title: document.title });
    applyTranslations();
    observe();
  }

  window.MushavoI18n = {
    languages,
    getLanguage,
    setLanguage(language) {
      localStorage.setItem(STORAGE_KEY, language);
      applyTranslations();
    },
    t: translate,
    apply: applyTranslations
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
