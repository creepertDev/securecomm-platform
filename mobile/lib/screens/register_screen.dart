import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/chat_provider.dart';
import '../constants.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  String _selectedRole = 'Personnel';
  bool _loading = false;
  bool _obscure = true;

  static const _roles = ['Personnel', 'Family', 'Veteran'];

  @override
  void dispose() {
    _nameCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    final name = _nameCtrl.text.trim();
    final pass = _passCtrl.text;
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Name is required.')),
      );
      return;
    }
    if (pass.length < 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 4 characters.')),
      );
      return;
    }

    final provider = context.read<ChatProvider>();
    if (!provider.isConnected) provider.connectWithKey();

    setState(() => _loading = true);
    provider.register(name, _selectedRole.toLowerCase(), pass);

    Future.delayed(const Duration(seconds: 6), () {
      if (mounted) setState(() => _loading = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('REQUEST ACCESS')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 12),
              const Text(
                'Submit your details for HQ approval.',
                style: TextStyle(color: Colors.white54, fontSize: 13),
              ),
              const SizedBox(height: 28),
              TextField(
                controller: _nameCtrl,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Full Name / Call Sign',
                  prefixIcon: Icon(Icons.person_outline),
                ),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: surfaceBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.military_tech_outlined, color: Colors.white38, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButton<String>(
                        value: _selectedRole,
                        dropdownColor: surfaceBg,
                        isExpanded: true,
                        underline: const SizedBox.shrink(),
                        style: const TextStyle(color: Colors.white, fontSize: 16),
                        hint: const Text('Role', style: TextStyle(color: Colors.white54)),
                        items: _roles
                            .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                            .toList(),
                        onChanged: (v) => setState(() => _selectedRole = v!),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passCtrl,
                obscureText: _obscure,
                textInputAction: TextInputAction.done,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _obscure = !_obscure),
                    color: Colors.white38,
                  ),
                ),
                onSubmitted: (_) => _submit(),
              ),
              const SizedBox(height: 32),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('SUBMIT REQUEST'),
                ),
              ),
              const SizedBox(height: 16),
              // Role descriptions
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: surfaceBg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white10),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Role descriptions', style: TextStyle(fontSize: 12, color: Colors.white38, fontWeight: FontWeight.w600)),
                    SizedBox(height: 8),
                    _RoleRow('Personnel', 'Active-duty defence personnel'),
                    _RoleRow('Family',    'Immediate family of personnel'),
                    _RoleRow('Veteran',   'Honourably discharged veterans'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleRow extends StatelessWidget {
  final String role;
  final String desc;
  const _RoleRow(this.role, this.desc);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          SizedBox(
            width: 72,
            child: Text(role, style: const TextStyle(fontSize: 12, color: militaryGreen, fontWeight: FontWeight.w600)),
          ),
          Expanded(child: Text(desc, style: const TextStyle(fontSize: 12, color: Colors.white54))),
        ],
      ),
    );
  }
}
