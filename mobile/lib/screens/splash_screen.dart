import 'package:flutter/material.dart';
import '../constants.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeIn);
    _ctrl.forward();

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) Navigator.pushReplacementNamed(context, '/login');
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: darkBg,
      body: FadeTransition(
        opacity: _fade,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  color: militaryGreen.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: militaryGreen.withValues(alpha: 0.4), width: 1.5),
                ),
                child: const Icon(Icons.shield, size: 52, color: militaryGreen),
              ),
              const SizedBox(height: 28),
              const Text(
                appName,
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: 6,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'SECURE COMMUNICATIONS',
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.white38,
                  letterSpacing: 4,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 60),
              const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: militaryGreen,
                  strokeWidth: 2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
