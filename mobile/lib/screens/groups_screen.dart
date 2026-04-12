import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/chat_provider.dart';
import '../constants.dart';

class GroupsScreen extends StatelessWidget {
  const GroupsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ChatProvider>();
    final groups   = provider.groups;
    final userId   = provider.userId ?? '';
    final userName = provider.userName ?? '';
    final userRole = provider.userRole ?? '';
    final avatar   = provider.userAvatar ?? '👤';

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Row(
          children: [
            const Icon(Icons.shield, size: 18, color: militaryGreen),
            const SizedBox(width: 8),
            const Text(appName),
          ],
        ),
        actions: [
          // Online indicator
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
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
          IconButton(
            icon: const Icon(Icons.logout, size: 20),
            onPressed: () {
              provider.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // User ID card
          Container(
            margin: const EdgeInsets.all(16),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: cardBg,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white10),
            ),
            child: Row(
              children: [
                Text(avatar, style: const TextStyle(fontSize: 28)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(userName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                      Text(userRole.toUpperCase(), style: const TextStyle(fontSize: 11, color: Colors.white38, letterSpacing: 1.5)),
                      const SizedBox(height: 4),
                      GestureDetector(
                        onTap: () {
                          Clipboard.setData(ClipboardData(text: userId));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('User ID copied'), duration: Duration(seconds: 1)),
                          );
                        },
                        child: Row(
                          children: [
                            Text(
                              'ID: ${userId.length > 16 ? userId.substring(0, 16) : userId}…',
                              style: const TextStyle(fontSize: 11, color: Colors.white30, fontFamily: 'monospace'),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.copy, size: 11, color: Colors.white30),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                // Online count badge
                Column(
                  children: [
                    Text(
                      '${provider.onlineUsers.length}',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: militaryGreen),
                    ),
                    const Text('online', style: TextStyle(fontSize: 10, color: Colors.white30)),
                  ],
                ),
              ],
            ),
          ),

          // Section header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
            child: Row(
              children: [
                const Text('SECURE CHANNELS', style: TextStyle(fontSize: 10, color: Colors.white30, letterSpacing: 2, fontWeight: FontWeight.w600)),
                const Spacer(),
                Text('${groups.length} assigned', style: const TextStyle(fontSize: 10, color: Color(0x33FFFFFF))),
              ],
            ),
          ),

          // Groups list
          Expanded(
            child: groups.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.lock_outline, size: 48, color: Colors.white12),
                        const SizedBox(height: 16),
                        const Text(
                          'No channels assigned',
                          style: TextStyle(color: Colors.white30, fontSize: 15),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'HQ will assign you to channels\nafter verifying your credentials.',
                          style: TextStyle(color: Color(0x33FFFFFF), fontSize: 12, height: 1.6),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: groups.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (ctx, i) {
                      final g = groups[i];
                      final unread = (provider.groupMessages[g.groupId] ?? []).length;
                      return _GroupTile(group: g, messageCount: unread);
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _GroupTile extends StatelessWidget {
  final Group group;
  final int messageCount;

  const _GroupTile({required this.group, required this.messageCount});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: cardBg,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () {
          context.read<ChatProvider>().loadGroupHistory(group.groupId);
          Navigator.pushNamed(context, '/chat', arguments: {
            'groupId':   group.groupId,
            'groupName': group.name,
          });
        },
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.white10),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: Color(0x261B5E20),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Color(0x4D1B5E20)),
                ),
                child: const Icon(Icons.lock, size: 20, color: militaryGreen),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(group.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                    if (group.description.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 3),
                        child: Text(
                          group.description,
                          style: const TextStyle(fontSize: 12, color: Colors.white38),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Color(0x33FFFFFF), size: 20),
            ],
          ),
        ),
      ),
    );
  }
}
