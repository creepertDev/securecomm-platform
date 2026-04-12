import 'package:flutter/material.dart';
import '../constants.dart';

class PendingScreen extends StatefulWidget {
  const PendingScreen({super.key});

  @override
  State<PendingScreen> createState() => _PendingScreenState();
}

class _PendingScreenState extends State<PendingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulse;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _scale = Tween<double>(begin: 0.9, end: 1.1).animate(
      CurvedAnimation(parent: _pulse, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Pulsing shield icon
              ScaleTransition(
                scale: _scale,
                child: Container(
                  width: 110,
                  height: 110,
                  decoration: BoxDecoration(
                    color: militaryGreen.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                    border: Border.all(color: militaryGreen.withValues(alpha: 0.3), width: 1.5),
                  ),
                  child: const Icon(Icons.shield, size: 56, color: militaryGreen),
                ),
              ),
              const SizedBox(height: 40),
              const SizedBox(
                width: 36,
                height: 36,
                child: CircularProgressIndicator(
                  color: militaryGreen,
                  strokeWidth: 3,
                ),
              ),
              const SizedBox(height: 28),
              const Text(
                'Awaiting HQ Approval',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 14),
              const Text(
                'Your access request has been submitted.\nAn HQ administrator will review it shortly.',
                style: TextStyle(fontSize: 13, color: Colors.white54, height: 1.6),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              // Status dots
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(3, (i) => _Dot(delay: i * 300)),
              ),
              const SizedBox(height: 40),
              TextButton(
                onPressed: () => Navigator.pushReplacementNamed(context, '/login'),
                child: const Text(
                  'Cancel request',
                  style: TextStyle(color: Colors.white30, fontSize: 13),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Dot extends StatefulWidget {
  final int delay;
  const _Dot({required this.delay});

  @override
  State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _anim = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _ctrl.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: FadeTransition(
        opacity: _anim,
        child: Container(
          width: 8,
          height: 8,
          decoration: const BoxDecoration(
            color: militaryGreen,
            shape: BoxShape.circle,
          ),
        ),
      ),
    );
  }
}
