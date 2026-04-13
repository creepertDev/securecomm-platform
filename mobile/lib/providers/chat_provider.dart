import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/io.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants.dart';

class ChatMessage {
  final String id;
  final String userId;
  final String name;
  final String role;
  final String avatar;
  final String text;
  final String? groupId;
  final DateTime ts;

  ChatMessage({
    required this.id,
    required this.userId,
    required this.name,
    required this.role,
    required this.avatar,
    required this.text,
    this.groupId,
    required this.ts,
  });

  factory ChatMessage.fromMap(Map<String, dynamic> m) {
    final from = m['from'] as Map<String, dynamic>? ?? {};
    return ChatMessage(
      id:      m['id'] as String? ?? '',
      userId:  from['userId'] as String? ?? '',
      name:    from['name'] as String? ?? 'Unknown',
      role:    from['role'] as String? ?? '',
      avatar:  from['avatar'] as String? ?? '👤',
      text:    m['text'] as String? ?? '',
      groupId: m['groupId'] as String?,
      ts: m['ts'] != null
          ? DateTime.fromMillisecondsSinceEpoch(m['ts'] as int)
          : DateTime.now(),
    );
  }
}

class OnlineUser {
  final String userId;
  final String name;
  final String role;
  final String avatar;

  OnlineUser({required this.userId, required this.name, required this.role, required this.avatar});

  factory OnlineUser.fromMap(Map<String, dynamic> m) => OnlineUser(
        userId: m['userId'] as String? ?? '',
        name:   m['name']   as String? ?? '',
        role:   m['role']   as String? ?? '',
        avatar: m['avatar'] as String? ?? '👤',
      );
}

class Group {
  final String groupId;
  final String name;
  final String description;

  Group({required this.groupId, required this.name, required this.description});

  factory Group.fromMap(Map<String, dynamic> m) => Group(
        groupId:     m['groupId']     as String? ?? '',
        name:        m['name']        as String? ?? '',
        description: m['description'] as String? ?? '',
      );
}

class ChatProvider extends ChangeNotifier {
  final GlobalKey<NavigatorState> navigatorKey;
  final _storage = const FlutterSecureStorage();

  WebSocketChannel? _channel;
  StreamSubscription? _sub;

  // Current user
  String? userId;
  String? userName;
  String? userRole;
  String? userAvatar;
  String? token;
  String? reqId;

  // Global chat
  List<ChatMessage> messages = [];
  List<OnlineUser> onlineUsers = [];
  final Map<String, bool> _typingUsers = {};

  // Groups
  List<Group> groups = [];
  final Map<String, List<ChatMessage>> groupMessages = {}; // groupId → messages
  final Map<String, Map<String, bool>> _groupTyping = {};  // groupId → {name: isTyping}

  bool isConnected = false;
  String? connectionError;

  ChatProvider(this.navigatorKey);

  String get typingText => _typingTextFor(null);

  String typingTextForGroup(String groupId) => _typingTextFor(groupId);

  String _typingTextFor(String? groupId) {
    final Map<String, bool> map = groupId == null
        ? _typingUsers
        : (_groupTyping[groupId] ?? {});
    final names = map.entries
        .where((e) => e.value && e.key != userName)
        .map((e) => e.key)
        .toList();
    if (names.isEmpty) return '';
    if (names.length == 1) return '${names[0]} is typing…';
    return 'Several people are typing…';
  }

  // ── Connection ──────────────────────────────────────────────────────────────

  void connect() => connectWithKey();

  void connectWithKey() {
    _sub?.cancel();
    _channel?.sink.close();
    connectionError = null;
    isConnected = false;
    notifyListeners();

    try {
      // IOWebSocketChannel supports custom headers on native iOS/Android
      _channel = IOWebSocketChannel.connect(
        Uri.parse(wsUrl),
        headers: {'x-device-key': deviceKey},
      );
      isConnected = true;
      notifyListeners();

      _sub = _channel!.stream.listen(
        _onMessage,
        onError: (e) {
          connectionError = e.toString().contains('403')
              ? 'Device not authorized. Contact HQ.'
              : 'Connection error: $e';
          isConnected = false;
          notifyListeners();
        },
        onDone: () {
          isConnected = false;
          notifyListeners();
        },
      );
    } catch (e) {
      connectionError = 'Failed to connect: $e';
      isConnected = false;
      notifyListeners();
    }
  }

  void _send(Map<String, dynamic> data) {
    if (_channel != null) _channel!.sink.add(jsonEncode(data));
  }

  // ── Outbound actions ────────────────────────────────────────────────────────

  void register(String name, String role, String password) {
    _send({'type': 'register', 'name': name, 'role': role, 'password': password});
  }

  void login(String name, String password) {
    _send({'type': 'login', 'name': name, 'password': password});
  }

  void sendMessage(String text, {String? groupId}) {
    final data = <String, dynamic>{'type': 'message', 'text': text};
    if (groupId != null) data['groupId'] = groupId;
    _send(data);
  }

  void sendTyping(bool isTypingNow, {String? groupId}) {
    final data = <String, dynamic>{'type': 'typing', 'isTyping': isTypingNow};
    if (groupId != null) data['groupId'] = groupId;
    _send(data);
  }

  void loadGroupHistory(String groupId) {
    _send({'type': 'join_group', 'groupId': groupId});
  }

  // ── Inbound handler ─────────────────────────────────────────────────────────

  void _onMessage(dynamic raw) {
    final msg  = jsonDecode(raw as String) as Map<String, dynamic>;
    final type = msg['type'] as String?;

    switch (type) {
      case 'register_pending':
        reqId = msg['reqId'] as String?;
        notifyListeners();
        navigatorKey.currentState?.pushReplacementNamed('/pending');

      case 'register_error':
        _showSnack(msg['message'] as String? ?? 'Registration failed.');

      case 'approved':
        userId   = msg['userId'] as String?;
        userName = msg['name']   as String?;
        token    = msg['token']  as String?;
        if (token != null) _storage.write(key: 'jwt', value: token!);
        // Store WireGuard config if provided
        final wgConf = msg['wgConfig'] as String?;
        if (wgConf != null && wgConf.isNotEmpty) {
          _storage.write(key: 'wg_config', value: wgConf);
        }
        notifyListeners();
        navigatorKey.currentState?.pushReplacementNamed('/groups');

      case 'rejected':
        _showSnack(msg['message'] as String? ?? 'Access request denied by HQ.');
        navigatorKey.currentState?.pushReplacementNamed('/login');

      case 'login_error':
        _showSnack(msg['message'] as String? ?? 'Invalid credentials.');

      case 'welcome':
        userId     = msg['userId']   as String?;
        userName   = msg['name']     as String?;
        userRole   = msg['role']     as String?;
        userAvatar = msg['avatar']   as String?;
        token      = msg['token']    as String?;
        if (token != null) _storage.write(key: 'jwt', value: token!);

        final history = (msg['history'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        messages = history.map(ChatMessage.fromMap).toList();

        final users = (msg['users'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        onlineUsers = users.map(OnlineUser.fromMap).toList();

        final grps = (msg['groups'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        groups = grps.map(Group.fromMap).toList();

        notifyListeners();
        navigatorKey.currentState?.pushReplacementNamed('/groups');

      case 'message':
        final m = ChatMessage.fromMap(msg);
        if (m.groupId != null) {
          groupMessages.putIfAbsent(m.groupId!, () => []).add(m);
        } else {
          messages.add(m);
        }
        notifyListeners();

      case 'group_history':
        final gId = msg['groupId'] as String?;
        if (gId != null) {
          final hist = (msg['messages'] as List?)?.cast<Map<String, dynamic>>() ?? [];
          groupMessages[gId] = hist.map(ChatMessage.fromMap).toList();
          notifyListeners();
        }

      case 'added_to_group':
        final g = msg['group'] as Map<String, dynamic>?;
        if (g != null) {
          final newGroup = Group.fromMap(g);
          if (!groups.any((x) => x.groupId == newGroup.groupId)) {
            groups.add(newGroup);
            notifyListeners();
            _showSnack('You\'ve been added to ${newGroup.name}');
          }
        }

      case 'group_removed':
        final gId = msg['groupId'] as String?;
        if (gId != null) {
          groups.removeWhere((g) => g.groupId == gId);
          groupMessages.remove(gId);
          notifyListeners();
        }

      case 'typing':
        final user    = msg['user'] as Map<String, dynamic>?;
        final gId     = msg['groupId'] as String?;
        final name    = user?['name'] as String? ?? '';
        final isTyping = msg['isTyping'] == true;
        if (gId != null) {
          _groupTyping.putIfAbsent(gId, () => {})[name] = isTyping;
        } else {
          _typingUsers[name] = isTyping;
        }
        notifyListeners();

      case 'user_joined':
      case 'user_left':
        final users = (msg['users'] as List?)?.cast<Map<String, dynamic>>() ?? [];
        onlineUsers = users.map(OnlineUser.fromMap).toList();
        notifyListeners();
    }
  }

  void _showSnack(String message) {
    final context = navigatorKey.currentContext;
    if (context != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: const Color(0xFFB71C1C),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void logout() {
    _sub?.cancel();
    _channel?.sink.close();
    _storage.delete(key: 'jwt');
    isConnected = false;
    userId = userName = userRole = userAvatar = token = null;
    messages = [];
    onlineUsers = [];
    groups = [];
    groupMessages.clear();
    _typingUsers.clear();
    _groupTyping.clear();
    notifyListeners();
  }

  @override
  void dispose() {
    _sub?.cancel();
    _channel?.sink.close();
    super.dispose();
  }
}
