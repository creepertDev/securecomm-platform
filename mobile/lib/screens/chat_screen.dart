import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:screen_protector/screen_protector.dart';
import '../providers/chat_provider.dart';
import '../constants.dart';

class ChatScreen extends StatefulWidget {
  final String? groupId;
  final String? groupName;

  const ChatScreen({super.key, this.groupId, this.groupName});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> with WidgetsBindingObserver {
  final _textCtrl   = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _isTyping    = false;

  bool get _isGroupChat => widget.groupId != null;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _setupSecurity();
  }

  Future<void> _setupSecurity() async {
    try {
      // Block screenshots and screen recording
      await ScreenProtector.preventScreenshotOn();
      // Protect data when app goes to background (iOS blur)
      await ScreenProtector.protectDataLeakageWithColor(Colors.black);
    } catch (_) {}
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Extra protection: blur content when app is backgrounded
    if (state == AppLifecycleState.paused) {
      ScreenProtector.protectDataLeakageWithColor(Colors.black).catchError((_) {});
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _textCtrl.dispose();
    _scrollCtrl.dispose();
    ScreenProtector.preventScreenshotOff().catchError((_) {});
    ScreenProtector.protectDataLeakageOff().catchError((_) {});
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _send() {
    final text = _textCtrl.text.trim();
    if (text.isEmpty) return;
    context.read<ChatProvider>().sendMessage(text, groupId: widget.groupId);
    _textCtrl.clear();
    _setTyping(false);
    _scrollToBottom();
  }

  void _setTyping(bool typing) {
    if (_isTyping == typing) return;
    _isTyping = typing;
    context.read<ChatProvider>().sendTyping(typing, groupId: widget.groupId);
  }

  @override
  Widget build(BuildContext context) {
    final provider   = context.watch<ChatProvider>();
    final myId       = provider.userId;
    final messages   = _isGroupChat
        ? (provider.groupMessages[widget.groupId] ?? [])
        : provider.messages;
    final typingText = _isGroupChat
        ? provider.typingTextForGroup(widget.groupId!)
        : provider.typingText;

    if (messages.isNotEmpty) _scrollToBottom();

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _isGroupChat ? widget.groupName! : appName,
              style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
            ),
            Text(
              _isGroupChat ? 'Secure Channel' : '${provider.onlineUsers.length} online',
              style: const TextStyle(fontSize: 11, color: Colors.white38),
            ),
          ],
        ),
        actions: [
          // Lock icon — indicates E2E transport encryption
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 4),
            child: Icon(Icons.lock, size: 16, color: militaryGreen),
          ),
          // Connection dot
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Container(
                width: 7, height: 7,
                decoration: BoxDecoration(
                  color: provider.isConnected ? const Color(0xFF4CAF50) : Colors.red,
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages
          Expanded(
            child: messages.isEmpty
                ? const Center(
                    child: Text(
                      'No messages yet.\nSend the first one.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.white24, fontSize: 14),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
                    itemCount: messages.length,
                    itemBuilder: (ctx, i) {
                      final m = messages[i];
                      final isMe = m.userId == myId;
                      final showDate = i == 0 || !_sameDay(messages[i - 1].ts, m.ts);
                      return Column(
                        children: [
                          if (showDate) _DateSeparator(date: m.ts),
                          _MessageBubble(message: m, isMe: isMe),
                        ],
                      );
                    },
                  ),
          ),

          // Typing indicator
          if (typingText.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 4),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  typingText,
                  style: const TextStyle(fontSize: 11, color: Colors.white38, fontStyle: FontStyle.italic),
                ),
              ),
            ),

          // Input bar
          Container(
            color: cardBg,
            padding: const EdgeInsets.fromLTRB(12, 8, 8, 8),
            child: SafeArea(
              top: false,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 120),
                      child: _SecureTextField(
                        controller: _textCtrl,
                        onChanged: (v) => _setTyping(v.isNotEmpty),
                        onSubmitted: (_) => _send(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Material(
                    color: militaryGreen,
                    borderRadius: BorderRadius.circular(8),
                    child: InkWell(
                      onTap: _send,
                      borderRadius: BorderRadius.circular(8),
                      child: const Padding(
                        padding: EdgeInsets.all(11),
                        child: Icon(Icons.send, size: 20, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}

// ── Secure text field — disables copy/paste/cut context menu ────────────────

class _SecureTextField extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final ValueChanged<String> onSubmitted;

  const _SecureTextField({
    required this.controller,
    required this.onChanged,
    required this.onSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      maxLines: null,
      textInputAction: TextInputAction.send,
      // Restrict clipboard operations
      contextMenuBuilder: (_, __) => const SizedBox.shrink(),
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      decoration: const InputDecoration(
        hintText: 'Secure message…',
        contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        isDense: true,
      ),
    );
  }
}

// ── Message bubble ──────────────────────────────────────────────────────────

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  final bool isMe;

  const _MessageBubble({required this.message, required this.isMe});

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('HH:mm').format(message.ts);

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          top: 3, bottom: 3,
          left: isMe ? 60 : 12,
          right: isMe ? 12 : 60,
        ),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (!isMe)
              Padding(
                padding: const EdgeInsets.only(left: 4, bottom: 3),
                child: Text(
                  '${message.avatar}  ${message.name}',
                  style: const TextStyle(fontSize: 11, color: Colors.white54, fontWeight: FontWeight.w600),
                ),
              ),
            // Bubble — disable long-press selection to block copy
            SelectionContainer.disabled(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: isMe ? const Color(0xFF1B5E20) : surfaceBg,
                  borderRadius: BorderRadius.only(
                    topLeft:     const Radius.circular(16),
                    topRight:    const Radius.circular(16),
                    bottomLeft:  Radius.circular(isMe ? 16 : 4),
                    bottomRight: Radius.circular(isMe ? 4 : 16),
                  ),
                  border: isMe ? null : Border.all(color: Colors.white10, width: 0.5),
                ),
                child: Text(message.text, style: const TextStyle(fontSize: 14.5, height: 1.4)),
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(top: 3, left: 4, right: 4),
              child: Text(timeStr, style: const TextStyle(fontSize: 10, color: Colors.white30)),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Date separator ──────────────────────────────────────────────────────────

class _DateSeparator extends StatelessWidget {
  final DateTime date;
  const _DateSeparator({required this.date});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    String label;
    if (_sameDay(date, now)) {
      label = 'Today';
    } else if (_sameDay(date, now.subtract(const Duration(days: 1)))) {
      label = 'Yesterday';
    } else {
      label = DateFormat('d MMM yyyy').format(date);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        children: [
          const Expanded(child: Divider(color: Colors.white12)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(label, style: const TextStyle(fontSize: 11, color: Colors.white30)),
          ),
          const Expanded(child: Divider(color: Colors.white12)),
        ],
      ),
    );
  }

  bool _sameDay(DateTime a, DateTime b) =>
      a.year == b.year && a.month == b.month && a.day == b.day;
}
