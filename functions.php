<?php

add_action('init', function() {
    if (PHP_SESSION_NONE === session_status()) {
        session_start();
    }
    
    // CORS 헤더 설정
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-WP-Nonce");
        header("Access-Control-Expose-Headers: X-WP-Nonce");
    }
}, 1);  // 우선순위를 1로 설정하여 가장 먼저 실행되도록 함

add_action('rest_api_init', function () {
    register_rest_route('custom/v1', '/register', array(
        'methods' => 'POST',
        'callback' => 'register_user_api',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('custom/v1', '/login', array(
        'methods' => 'POST',
        'callback' => 'login_user_api',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('custom/v1', '/update-order-status', array(
        'methods' => ['POST', 'OPTIONS'],
        'callback' => 'update_order_status_callback',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('custom/v1', '/my-orders', array(
        'methods' => 'GET',
        'callback' => 'get_user_orders_api',
        'permission_callback' => function() {
            return is_user_logged_in();
        }
    ));
});

function register_user_api($request) {
    $username = sanitize_user($request['username']);
    $email = sanitize_email($request['email']);
    $password = $request['password'];

    $error = new WP_Error();

    if (empty($username)) {
        $error->add('username_empty', '사용자 이름은 필수입니다.');
    }
    if (empty($email)) {
        $error->add('email_empty', '이메일은 필수입니다.');
    }
    if (empty($password)) {
        $error->add('password_empty', '비밀번호는 필수입니다.');
    }

    if ($error->get_error_codes()) {
        return $error;
    }

    $user_id = wp_create_user($username, $password, $email);

    if (is_wp_error($user_id)) {
        return $user_id;
    }

    $user = new WP_User($user_id);
    $user->set_role('customer');

    return array(
        'status' => 'success',
        'message' => '회원가입이 완료되었습니다.'
    );
}

function login_user_api($request) {
    $username = $request['username'];
    $password = $request['password'];

    $user = wp_authenticate($username, $password);

    if (is_wp_error($user)) {
        return new WP_Error(
            'login_failed',
            '아이디 또는 비밀번가 올바지 않습니다.',
            array('status' => 401)
        );
    }

    return array(
        'status' => 'success',
        'message' => '로그인 성공',
        'user' => array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'displayName' => $user->display_name
        )
    );
}

function update_order_status_callback($request) {
    $json = $request->get_json_params();
    $order_id = isset($json['order_id']) ? sanitize_text_field($json['order_id']) : '';
    
    error_log('[토스페이먼츠] 주문 상태 업데이트 시작 - Order ID: ' . $order_id);
    
    if (empty($order_id)) {
        return new WP_Error('no_order_id', '주문 ID가 필요합니다.', array('status' => 400));
    }

    try {
        // 주문 ID 정리
        $order_id = str_replace('#', '', $order_id);
        
        // WooCommerce 주문 객체 가져오기
        $order = wc_get_order($order_id);
        if (!$order) {
            throw new Exception('주문을 찾을 수 없습니다.');
        }

        // 결제 완료 처리
        $order->payment_complete();
        
        // 주문 상태 변경
        $order->update_status('processing');
        
        // 주문 메모 추가
        $order->add_order_note('토스페이먼츠 결제가 완료되었습니다.');
        
        // 변경사항 저장
        $order->save();
        
        error_log('[토스페이먼츠] 주문 처리 완료 - Order ID: ' . $order_id);
        
        return array(
            'success' => true,
            'message' => '주문 상태가 업데이트되었습니다.',
            'order_id' => $order_id
        );
        
    } catch (Exception $e) {
        error_log('[토스페이먼츠] 오류 발생: ' . $e->getMessage());
        return new WP_Error(
            'update_failed',
            '주문 상태 업데이트 실패: ' . $e->getMessage(),
            array('status' => 500)
        );
    }
}

function get_user_orders_api($request) {
    error_log('주문 조회 API 호출 시작');
    $user_id = get_current_user_id();
    error_log('현재 사용자 ID: ' . $user_id);
    
    if (!$user_id) {
        error_log('인증되지 않은 사용자');
        return new WP_Error(
            'unauthorized',
            '로그인이 필요합니다.',
            array('status' => 401)
        );
    }

    try {
        error_log('WooCommerce 주문 조회 시작');
        
        // WooCommerce가 활성화되어 있는지 확인
        if (!class_exists('WooCommerce')) {
            throw new Exception('WooCommerce가 활성화되어 있지 않습니다.');
        }

        global $wpdb;
        
        // 직접 SQL 쿼리로 주문 조회
        $orders_query = $wpdb->prepare(
            "SELECT ID FROM {$wpdb->posts} p
            JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id
            WHERE p.post_type = 'shop_order'
            AND pm.meta_key = '_customer_user'
            AND pm.meta_value = %d
            ORDER BY p.post_date DESC",
            $user_id
        );
        
        error_log('SQL 쿼리: ' . $orders_query);
        
        $order_ids = $wpdb->get_col($orders_query);
        error_log('조회된 주문 ID들: ' . print_r($order_ids, true));

        $formatted_orders = array();
        foreach ($order_ids as $order_id) {
            $order = wc_get_order($order_id);
            if (!$order) continue;

            // 주문 소유자 재확인
            if ($order->get_customer_id() != $user_id) {
                error_log('주문 소유자 불일치 - Order ID: ' . $order_id);
                continue;
            }

            $order_data = array(
                'id' => $order->get_id(),
                'status' => wc_get_order_status_name($order->get_status()),
                'total' => $order->get_total(),
                'date_created' => $order->get_date_created()->format('Y-m-d H:i:s'),
                'payment_method' => $order->get_payment_method_title(),
                'items' => array()
            );

            foreach ($order->get_items() as $item) {
                $order_data['items'][] = array(
                    'name' => $item->get_name(),
                    'quantity' => $item->get_quantity(),
                    'total' => $item->get_total()
                );
            }
            
            $formatted_orders[] = $order_data;
        }

        error_log('최종 응답 데이터: ' . print_r($formatted_orders, true));

        return array(
            'success' => true,
            'orders' => $formatted_orders,
            'user_id' => $user_id
        );

    } catch (Exception $e) {
        error_log('주문 조회 오류: ' . $e->getMessage());
        return new WP_Error(
            'order_fetch_error',
            $e->getMessage(),
            array('status' => 500)
        );
    }
}

// CORS 설정 통합
add_action('init', function() {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
        header("Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Requested-With");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Max-Age: 3600");
    }
    
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        status_header(200);
        exit();
    }
});

add_filter('woocommerce_rest_check_permissions', function($permission, $context, $object_id, $post_type) {
    if ($post_type === 'shop_order') {
        error_log('WooCommerce 주문 권한 체크: ' . $context);
        
        if (!is_user_logged_in()) {
            return false;
        }
        
        if ($object_id) {
            $order = wc_get_order($object_id);
            if ($order) {
                return $order->get_customer_id() === get_current_user_id();
            }
        }
    }
    return $permission;
}, 10, 4);

add_filter('woocommerce_rest_pre_insert_shop_order_object', function($order, $request) {
    error_log('WooCommerce 주문 생성 요청 데이터: ' . print_r($request->get_params(), true));
    return $order;
}, 10, 2);

add_filter('rest_pre_dispatch', function($result, $server, $request) {
    if (strpos($request->get_route(), '/wc/v3/orders') !== false) {
        error_log('WooCommerce API 요청 경로: ' . $request->get_route());
        error_log('WooCommerce API 요청 메소드: ' . $request->get_method());
        error_log('WooCommerce API 요청 헤더: ' . print_r($request->get_headers(), true));
        error_log('WooCommerce API 요청 파라미터: ' . print_r($request->get_params(), true));
    }
    return $result;
}, 10, 3);

add_filter('woocommerce_rest_pre_dispatch', function($result, $server, $request) {
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization");
        header("Access-Control-Allow-Credentials: true");
    }
    return $result;
}, 10, 3);

add_action('woocommerce_order_status_changed', function($order_id, $old_status, $new_status) {
    error_log(sprintf(
        '주문 상태 변경 - Order ID: %s, Old Status: %s, New Status: %s',
        $order_id,
        $old_status,
        $new_status
    ));
}, 10, 3);

// 비로그인 사용자 카트 기능 활성화
add_filter('woocommerce_persistent_cart_enabled', '__return_true');

// 비로그인 사용자 카트 키 설정
add_filter('woocommerce_cart_session_key', function($key, $customer_id) {
    if ($customer_id === 0) {
        if (!isset($_SESSION['guest_cart_key'])) {
            $_SESSION['guest_cart_key'] = wp_generate_uuid4();
        }
        return 'guest_cart_' . $_SESSION['guest_cart_key'];
    }
    return $key;
}, 10, 2);

// 카트 저장 간격 설정
add_filter('woocommerce_cart_session_save_interval', function() {
    return 60 * 60; // 1시간
});

// 게스트 카트 데이터 저장
add_action('woocommerce_cart_updated', function() {
    if (!is_user_logged_in() && isset($_SESSION['guest_cart_key'])) {
        $cart_key = 'guest_cart_' . $_SESSION['guest_cart_key'];
        $cart_content = WC()->cart->get_cart_for_session();
        set_transient($cart_key, $cart_content, 60 * 60 * 24); // 24시간 유지
    }
});

// 게스트 카트 데이터 복원
add_action('woocommerce_cart_loaded_from_session', function() {
    if (!is_user_logged_in() && isset($_SESSION['guest_cart_key'])) {
        $cart_key = 'guest_cart_' . $_SESSION['guest_cart_key'];
        $cart_content = get_transient($cart_key);
        if ($cart_content) {
            WC()->cart->set_cart_contents($cart_content);
        }
    }
});

add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        if (isset($_SERVER['HTTP_ORIGIN'])) {
            header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Authorization, Content-Type');
        }
        return $value;
    });
}, 15);