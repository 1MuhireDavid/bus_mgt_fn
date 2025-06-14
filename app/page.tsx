"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bus, 
  Users, 
  MapPin, 
  BarChart3, 
  Clock,
  ArrowRight,
  Menu,
  X,
  Star,
  TrendingUp,
  Phone,
  Mail,
  MapIcon,
  Gauge,
  Shield
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from 'next/navigation';

const FleetManagementLanding = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const { user, initializeAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
    const redirectToDashboard = (userData: any) => {
      const isAdmin = userData.user_roles?.some(role => role.name === 'admin') || 
                     userData.user_roles?.some(role => role.name === 'Company Admin') ||
                     userData.is_superuser;
      
      if (isAdmin) {
        router.push('/admin');
        return;
      }

      const userRoles = userData.user_roles || [];
      
      const isFuelAttendant = userRoles.some(role => role.name === 'Fuel Attendant');
      const isCarWashAttendant = userRoles.some(role => role.name === 'Car Wash Attendant');
      const isGarageAttendant = userRoles.some(role => role.name === 'maintenance');
      const isConductor = userRoles.some(role => role.name === 'Conductor');

      if (isFuelAttendant) {
        router.push('/fuel_attendant');
      } else if (isCarWashAttendant) {
        router.push('/car_wash');
      } else if (isGarageAttendant) {
        router.push('/garage/maintenance');
      } else if (isConductor) {
        router.push('/conductor');
      } else {
        router.push('/');
      }
    };
    
    if (user) {
      redirectToDashboard(user);
    }
  }, [user, router, initializeAuth]);

  // Auto-rotate features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Bus,
      title: "Bus Tracking",
      description: "Monitor your buses in real-time with GPS tracking and instant status updates"
    },
    {
      icon: BarChart3,
      title: "Expense Analytics",
      description: "Track fuel, maintenance, and operational costs with detailed reporting"
    },
    {
      icon: Users,
      title: "Staff Management",
      description: "Manage drivers, conductors, and attendants with smart scheduling"
    }
  ];

  const stats = [
    { value: "500+", label: "Buses Managed", icon: Bus },
    { value: "1000+", label: "Active Users", icon: Users },
    { value: "99.9%", label: "Uptime", icon: TrendingUp },
    { value: "24/7", label: "Support", icon: Clock }
  ];

  const testimonials = [
    {
      name: "Sarah Mwangi",
      role: "Bus Manager",
      company: "Stella Express",
      content: "This system transformed our fleet operations. Real-time tracking and expense management in one platform.",
      rating: 5
    },
    {
      name: "John Kimani",
      role: "Operations Director", 
      company: "Rwannda Bus Lines",
      content: "Reduced scheduling conflicts by 80%. The staff management feature is game-changing.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                <Bus className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">
                BusFlow
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-slate-800 transition-colors">Features</a>
              <a href="#testimonials" className="text-slate-600 hover:text-slate-800 transition-colors">Reviews</a>
              <a href="#contact" className="text-slate-600 hover:text-slate-800 transition-colors">Contact</a>
              <Button variant="outline" size="sm" onClick={() => router.push('/login')}>
                Sign In
              </Button>
              <Button size="sm" className="bg-slate-800 hover:bg-slate-900">
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-slate-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="#features" className="block px-3 py-2 text-slate-600 hover:text-slate-800">Features</a>
                <a href="#testimonials" className="block px-3 py-2 text-slate-600 hover:text-slate-800">Reviews</a>
                <a href="#contact" className="block px-3 py-2 text-slate-600 hover:text-slate-800">Contact</a>
                <div className="flex gap-2 px-3 py-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push('/login')}>
                    Sign In
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-slate-800">
              Manage Your Bus Fleet
              <br />
              <span className="text-blue-600">Expenses & Operations</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Streamline your bus fleet operations with comprehensive expense tracking, 
              real-time monitoring, and staff management in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-slate-800 hover:bg-slate-900 text-lg px-8 py-3" onClick={() => router.push('/login')}>
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center border-0 shadow-sm bg-white">
                <CardContent className="p-6">
                  <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                  <div className="text-sm text-slate-600">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800">
              Everything You Need to Run Your Fleet
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful tools designed specifically for bus fleet management
            </p>
          </div>

          {/* Main Features */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div className="space-y-6">
              {features.map((feature, index) => (
                <Card 
                  key={index}
                  className={`cursor-pointer transition-all duration-300 ${
                    activeFeature === index 
                      ? 'border-blue-500 shadow-md bg-blue-50' 
                      : 'hover:shadow-sm border-slate-200'
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        activeFeature === index ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2 text-slate-800">{feature.title}</h3>
                        <p className="text-slate-600">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="bg-slate-50 rounded-2xl p-8 min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-6">
                  {React.createElement(features[activeFeature].icon, { className: "h-12 w-12 text-white" })}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-800">{features[activeFeature].title}</h3>
                <p className="text-slate-600 text-lg">{features[activeFeature].description}</p>
              </div>
            </div>
          </div>

          {/* Additional Features Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: "GPS Tracking", description: "Real-time location monitoring" },
              { icon: Gauge, title: "Fuel Management", description: "Track consumption and costs" },
              { icon: Shield, title: "Safety Monitoring", description: "Driver behavior insights" }
            ].map((item, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-slate-800">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800">
              Trusted by Bus Operators
            </h2>
            <p className="text-xl text-slate-600">Real results from real customers</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-sm">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-6 text-lg italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold text-slate-800">{testimonial.name}</div>
                    <div className="text-sm text-slate-600">{testimonial.role}</div>
                    <div className="text-sm text-blue-600">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Optimize Your Bus?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join fleet operators who have streamlined their operations with FleetFlow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 text-white border-white hover:bg-white hover:text-slate-800">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Bus className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">BusFlow</span>
              </div>
              <p className="text-slate-400 mb-4">
                Professional bus management for modern transport companies.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">+250 780 123 456</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">hello@busflow.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapIcon className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">Rwanda, Kigali</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Updates</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 BusFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FleetManagementLanding;