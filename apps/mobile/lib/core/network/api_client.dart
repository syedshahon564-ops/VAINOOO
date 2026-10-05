import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late Dio dio;
  static const String baseUrl = 'http://10.0.2.2:5000/api/v1'; // Android emulator localhost

  ApiClient._internal() {
    dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        return handler.next(e);
      },
    ));
  }

  // Auth
  Future<Response> login(String phone, String password) {
    return dio.post('/auth/login', data: {'phone': phone, 'password': password});
  }

  Future<Response> register(String phone, String password, String ign, String uid) {
    return dio.post('/auth/register', data: {
      'phone': phone,
      'password': password,
      'ign': ign,
      'uid': uid,
    });
  }

  Future<Response> getProfile() {
    return dio.get('/auth/profile');
  }

  // Tournaments
  Future<Response> getTournaments([String? status]) {
    return dio.get('/tournaments', queryParameters: status != null ? {'status': status} : null);
  }

  Future<Response> getTournamentDetails(String id) {
    return dio.get('/tournaments/$id');
  }

  Future<Response> joinSlot(String tournamentId, int slotNumber, [String? teamName]) {
    return dio.post('/tournaments/$tournamentId/join', data: {
      'slotNumber': slotNumber,
      'teamName': teamName,
    });
  }

  // Rooms
  Future<Response> getRoomCredentials(String tournamentId) {
    return dio.get('/rooms/$tournamentId/credentials');
  }

  // Wallet
  Future<Response> requestDeposit(String method, double amount, String phone, String trxId) {
    return dio.post('/wallet/deposit', data: {
      'method': method,
      'amount': amount,
      'phone': phone,
      'trxId': trxId,
    });
  }

  Future<Response> requestWithdraw(String method, double amount, String phone) {
    return dio.post('/wallet/withdraw', data: {
      'method': method,
      'amount': amount,
      'phone': phone,
    });
  }

  Future<Response> getWalletHistory() {
    return dio.get('/wallet/history');
  }
}
